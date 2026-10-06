import type { SekaiRegion, UploadDataType } from "@/types"
import { isUploadDataType, UPLOAD_DATA_TYPES } from "@/lib/upload-data-type"
import { makeGameAccountKey, makeGrantedGameAccountKey } from "@/shared/sekai/user-snapshot/selectable-accounts"
import type { AccessibleGameAccount } from "@/shared/sekai/user-snapshot/accessible-accounts"

/**
 * One row of the manual-upload account selector. `writable` mirrors the
 * backend's `writeCapabilities` verbatim: it is the only thing that decides
 * whether (and which) data may be uploaded — never ownership.
 */
export interface UploadTargetAccount {
  key: string
  server: SekaiRegion
  uid: string
  ownership: "own" | "granted"
  verified: boolean
  isDefault: boolean
  writable: ReadonlySet<UploadDataType>
  canUpload: boolean
}

export function buildUploadTargetAccounts(accessible: readonly AccessibleGameAccount[]): UploadTargetAccount[] {
  return accessible.map((account) => {
    const writable = new Set<UploadDataType>()
    for (const kind of Object.keys(account.writeCapabilities)) {
      if (isUploadDataType(kind)) {
        writable.add(kind)
      }
    }
    const isOwn = account.ownership === "own"
    return {
      key: isOwn
        ? makeGameAccountKey({ server: account.server, userId: account.gameUserId })
        : makeGrantedGameAccountKey(account),
      server: account.server,
      uid: account.gameUserId,
      ownership: account.ownership,
      verified: account.verified,
      isDefault: isOwn && account.isDefault,
      writable,
      canUpload: writable.size > 0,
    }
  })
}

/**
 * Fallback used only when the write-targets request itself fails (not when it
 * returns an empty list): own verified bindings from the session, assumed
 * writable for every upload type. The server still authorizes each upload.
 */
export function buildFallbackUploadTargetAccounts(
  bindings: ReadonlyArray<{ server: SekaiRegion; userId: string | number; verified?: boolean; isDefault?: boolean }>,
): UploadTargetAccount[] {
  return bindings.map((binding) => {
    const verified = binding.verified === true
    return {
      key: makeGameAccountKey(binding),
      server: binding.server,
      uid: String(binding.userId),
      ownership: "own",
      verified,
      isDefault: binding.isDefault === true,
      writable: new Set<UploadDataType>(verified ? UPLOAD_DATA_TYPES : []),
      canUpload: verified,
    }
  })
}

/**
 * Keeps a still-uploadable current selection; otherwise prefers the own
 * default account, then any own account, then the first granted one — each
 * tier restricted to accounts that can upload at all.
 */
export function pickUploadTargetKey(
  accounts: readonly UploadTargetAccount[],
  currentKey: string | null,
): string | null {
  const uploadable = accounts.filter((account) => account.canUpload)
  if (currentKey && uploadable.some((account) => account.key === currentKey)) {
    return currentKey
  }
  const own = uploadable.filter((account) => account.ownership === "own")
  return (
    own.find((account) => account.isDefault)
    ?? own[0]
    ?? uploadable[0]
  )?.key ?? null
}

/** First data type the account may receive, in the selector's option order. */
export function pickWritableDataType(
  account: UploadTargetAccount | null,
  preferred: UploadDataType,
  allowed: (dataType: UploadDataType) => boolean,
): UploadDataType | null {
  if (!account) return null
  if (account.writable.has(preferred) && allowed(preferred)) return preferred
  return UPLOAD_DATA_TYPES.find((dataType) => account.writable.has(dataType) && allowed(dataType)) ?? null
}
