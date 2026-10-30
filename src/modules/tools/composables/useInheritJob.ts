import { computed, onScopeDispose, ref, shallowRef, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useSettingsStore } from "@/shared/stores/settings"
import { resetDeckRecommendUserDataAvailability } from "@/modules/deck-recommend/lib/user-data-availability"
import {
  cancelInheritJob,
  confirmInheritJob,
  createInheritJob,
  fetchInheritJob,
  fetchInheritJobWsTicket,
  InheritApiError,
  toInheritApiError,
  type CreateInheritJobInput,
} from "@/modules/tools/api/inherit"
import {
  canCancelJob,
  isTerminalJobStatus,
  type InheritJob,
  type InheritNewCode,
} from "@/modules/tools/lib/inherit-job"
import {
  InheritCommandLostError,
  InheritJobConnection,
  InheritSocketUnavailableError,
  resolveInheritJobSocketUrl,
  type InheritConnectionState,
  type InheritJobCommand,
  type InheritSocketLike,
} from "@/modules/tools/lib/inherit-job-connection"
import {
  clearActiveInheritJob,
  clearLegacyInheritStorage,
  loadActiveInheritJob,
  saveActiveInheritJob,
} from "@/modules/tools/lib/inherit-job-storage"
import type { InheritUnlockInput } from "@/modules/tools/lib/inherit-vault"

export interface InheritJobStart {
  job: InheritJob
  /** The backend already had a running job for this user and the page reattached to it. */
  resumed: boolean
}

/** When the job was created, for the one-hour local record; now if the snapshot does not say. */
function jobCreatedAtMs(job: InheritJob, now = Date.now()): number {
  const parsed = job.createdAt ? Date.parse(job.createdAt) : Number.NaN
  return Number.isFinite(parsed) && parsed <= now ? parsed : now
}

function createBrowserSocket(url: string): InheritSocketLike | null {
  if (typeof WebSocket === "undefined") return null
  return new WebSocket(url) as unknown as InheritSocketLike
}

/**
 * One inherit job at a time: create it, follow it live, confirm or cancel
 * it, and keep the newly issued transfer code on screen until the owner
 * acknowledged it, whatever happens to the job afterwards. Resumes the job
 * this browser was following when the page is reopened.
 */
export function useInheritJob(userId: () => string | null | undefined) {
  const { t } = useI18n()
  const settingsStore = useSettingsStore()

  const job = shallowRef<InheritJob | null>(null)
  const connectionState = ref<InheritConnectionState>("closed")
  const creating = ref(false)
  const commandPending = ref<"confirm" | "cancel" | null>(null)
  const resuming = ref(false)
  /** The job record expired (one hour) or is not ours while we still showed it. */
  const expired = ref(false)
  /**
   * The newest code the job reported. Kept in memory (never in storage) so a
   * later snapshot without it, or the record expiring, cannot take it off
   * the screen before the owner wrote it down.
   */
  const newCode = shallowRef<InheritNewCode | null>(null)
  const codeAcknowledged = ref(false)

  let connection: InheritJobConnection | null = null
  let storedCreatedAt = 0
  let celebratedJobId = ""

  // The retired "remember" option kept the code in plaintext; drop any copy.
  clearLegacyInheritStorage()

  function persist() {
    const owner = userId()
    const current = job.value
    if (!owner || !current) return
    saveActiveInheritJob({
      jobId: current.id,
      userId: owner,
      createdAt: storedCreatedAt || Date.now(),
      codeAcknowledged: codeAcknowledged.value,
    })
  }

  function applyJob(next: InheritJob) {
    const previous = job.value
    if (previous && previous.id !== next.id) return
    job.value = next
    if (next.newCode) newCode.value = next.newCode
    if (next.status === "succeeded" && celebratedJobId !== next.id && previous?.status !== "succeeded") {
      celebratedJobId = next.id
      // The uid is resolved server-side: the deck page's "no data uploaded"
      // flags for this server must re-probe.
      resetDeckRecommendUserDataAvailability(next.server)
      if (previous) {
        toast.success(t("tools.uploadData.inheritJob.toast.succeeded"))
      }
    }
  }

  function connect(jobId: string) {
    connection?.stop()
    const conn = new InheritJobConnection(
      jobId,
      {
        fetchTicket: fetchInheritJobWsTicket,
        fetchSnapshot: fetchInheritJob,
        socketUrl: (id, ticket) => resolveInheritJobSocketUrl(
          settingsStore.currentEndpoint,
          id,
          ticket,
          typeof window !== "undefined" ? window.location.origin : undefined,
        ),
        createSocket: createBrowserSocket,
        errorCode: (error) => toInheritApiError(error).code,
        commandError: ({ code, message }) => new InheritApiError(code, message),
      },
      {
        onJob: applyJob,
        onState: (state) => {
          connectionState.value = state
        },
        onGone: () => {
          expired.value = true
          connectionState.value = "closed"
        },
      },
    )
    connection = conn
    connectionState.value = "connecting"
    conn.start()
  }

  async function resume() {
    const owner = userId()
    if (!owner || job.value) return
    const stored = loadActiveInheritJob(owner)
    if (!stored) return
    resuming.value = true
    try {
      const snapshot = await fetchInheritJob(stored.jobId)
      // Signed out or switched account while the request was out.
      if (userId() !== owner || job.value) return
      storedCreatedAt = stored.createdAt
      codeAcknowledged.value = stored.codeAcknowledged
      // A finished job whose new code was acknowledged has nothing left to show.
      if (isTerminalJobStatus(snapshot.status) && stored.codeAcknowledged) {
        clearActiveInheritJob()
        return
      }
      celebratedJobId = snapshot.status === "succeeded" ? snapshot.id : ""
      job.value = snapshot
      if (snapshot.newCode) newCode.value = snapshot.newCode
      if (!isTerminalJobStatus(snapshot.status)) connect(snapshot.id)
    } catch (error) {
      if (toInheritApiError(error).code === "job_not_found") clearActiveInheritJob()
    } finally {
      resuming.value = false
    }
  }

  /** Starts following `next` from a clean slate: the job this page just created, or the one it reattached to. */
  function follow(next: InheritJob, createdAt: number) {
    connection?.stop()
    connection = null
    job.value = null
    newCode.value = null
    codeAcknowledged.value = false
    expired.value = false
    celebratedJobId = ""
    storedCreatedAt = createdAt
    applyJob(next)
    persist()
    if (!isTerminalJobStatus(next.status)) connect(next.id)
  }

  /**
   * Creates a job. When the backend refuses because this user already has
   * one running and names it (`job_already_running` with a job id: another
   * tab, or a page that lost the id), the page reattaches to that job
   * instead, whatever state it is in; `resumed` tells the caller so.
   */
  async function create(input: CreateInheritJobInput): Promise<InheritJobStart> {
    if (creating.value) throw new InheritApiError("busy", "")
    creating.value = true
    try {
      let created: InheritJob
      try {
        created = await createInheritJob(input)
      } catch (error) {
        const problem = toInheritApiError(error)
        if (!problem.runningJobId) throw problem
        let running: InheritJob
        try {
          running = await fetchInheritJob(problem.runningJobId)
        } catch {
          // Gone in the meantime, or unreachable: report the original refusal.
          throw problem
        }
        follow(running, jobCreatedAtMs(running))
        return { job: running, resumed: true }
      }
      follow(created, Date.now())
      return { job: created, resumed: false }
    } finally {
      creating.value = false
    }
  }

  async function runCommand(command: InheritJobCommand): Promise<InheritJob> {
    const current = job.value
    if (!current) throw new InheritApiError("job_not_found", "")
    const viaHttp = () => command.type === "confirm"
      ? confirmInheritJob(current.id, command)
      : cancelInheritJob(current.id)
    if (connection?.isLive) {
      try {
        return await connection.send(command)
      } catch (error) {
        if (!(error instanceof InheritSocketUnavailableError) && !(error instanceof InheritCommandLostError)) throw error
        if (error instanceof InheritCommandLostError) {
          // The command may have gone through: look before sending it again.
          const snapshot = await fetchInheritJob(current.id).catch(() => null)
          if (snapshot) {
            applyJob(snapshot)
            const stillPossible = command.type === "confirm" ? snapshot.status === "awaiting_confirm" : canCancelJob(snapshot)
            if (!stillPossible) return snapshot
          }
        }
      }
    }
    const snapshot = await viaHttp()
    connection?.acceptSnapshot(snapshot)
    if (!connection) applyJob(snapshot)
    return snapshot
  }

  async function confirm(unlock: InheritUnlockInput): Promise<void> {
    if (commandPending.value) return
    commandPending.value = "confirm"
    try {
      await runCommand({ type: "confirm", ...unlock })
    } catch (error) {
      const problem = toInheritApiError(error)
      // Confirmed from another tab, or the wait just ran out: the snapshot says which.
      if (problem.code === "job_not_awaiting_confirm") await refresh()
      throw problem
    } finally {
      commandPending.value = null
    }
  }

  async function cancel(): Promise<void> {
    if (commandPending.value) return
    commandPending.value = "cancel"
    try {
      await runCommand({ type: "cancel" })
    } catch (error) {
      const problem = toInheritApiError(error)
      if (problem.code === "cannot_cancel") await refresh()
      throw problem
    } finally {
      commandPending.value = null
    }
  }

  async function refresh() {
    const current = job.value
    if (!current) return
    try {
      applyJob(await fetchInheritJob(current.id))
    } catch (error) {
      if (toInheritApiError(error).code === "job_not_found") expired.value = true
    }
  }

  function acknowledgeCode() {
    codeAcknowledged.value = true
    persist()
  }

  /** Leaves a finished job; the new code must have been acknowledged first. */
  function dismiss(): boolean {
    if (newCode.value && !codeAcknowledged.value) return false
    connection?.stop()
    connection = null
    job.value = null
    newCode.value = null
    codeAcknowledged.value = false
    expired.value = false
    connectionState.value = "closed"
    clearActiveInheritJob()
    return true
  }

  const isActive = computed(() => job.value != null && !isTerminalJobStatus(job.value.status) && !expired.value)
  const canDismiss = computed(() => {
    const current = job.value
    if (!current) return false
    if (newCode.value && !codeAcknowledged.value) return false
    return isTerminalJobStatus(current.status) || expired.value
  })

  // Signing out (or switching accounts) must not keep someone else's job on screen.
  watch(
    () => userId() ?? null,
    (owner, previous) => {
      if (previous && owner !== previous) {
        connection?.stop()
        connection = null
        job.value = null
        newCode.value = null
        codeAcknowledged.value = false
        connectionState.value = "closed"
      }
      if (owner) void resume()
    },
    { immediate: true },
  )

  watch(job, (current) => {
    if (current && isTerminalJobStatus(current.status)) persist()
  })

  onScopeDispose(() => {
    connection?.stop()
    connection = null
  })

  return {
    job,
    newCode,
    codeAcknowledged,
    connectionState,
    creating,
    commandPending,
    resuming,
    expired,
    isActive,
    canDismiss,
    create,
    confirm,
    cancel,
    refresh,
    acknowledgeCode,
    dismiss,
  }
}

export type InheritJobController = ReturnType<typeof useInheritJob>
