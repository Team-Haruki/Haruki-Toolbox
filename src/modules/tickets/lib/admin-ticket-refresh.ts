import { ref } from "vue"

/**
 * Bumped whenever an admin mutates a ticket (status change, assignment, reply),
 * so admin-area surfaces that aggregate ticket state — notably the admin layout's
 * pending-ticket badge — can refresh promptly instead of waiting for the next
 * navigation or the periodic poll.
 */
export const adminTicketRefreshSignal = ref(0)

export function bumpAdminTicketRefresh() {
  adminTicketRefreshSignal.value += 1
}
