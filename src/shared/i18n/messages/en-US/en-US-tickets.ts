// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: tickets
export default {
  "tickets": {
    "common": {
      "dateFallback": "—",
      "unknownValue": "Unknown"
    },
    "systemMessage": {
      "statusChanged": "Status changed to “{status}”"
    },
    "status": {
      "open": "Open",
      "inProgress": "In progress",
      "pendingAdmin": "Pending admin",
      "pendingUser": "Pending user",
      "resolved": "Resolved",
      "closed": "Closed"
    },
    "userStatus": {
      "all": "All",
      "open": "Submitted",
      "pendingAdmin": "In progress",
      "pendingUser": "Awaiting your reply",
      "resolved": "Resolved",
      "closed": "Closed"
    },
    "userStatusHint": {
      "waitingAdmin": "Received, waiting for an admin",
      "waitingAdminAssigned": "An admin has picked it up; replies appear in the conversation",
      "waitingUser": "An admin has replied; add details or confirm",
      "resolved": "Close the ticket once it is handled",
      "closed": "Create a new ticket for another issue"
    },
    "time": {
      "justNow": "Just now"
    },
    "priority": {
      "low": "Low",
      "normal": "Normal",
      "medium": "Medium",
      "high": "High",
      "urgent": "Urgent"
    },
    "category": {
      "upload": "Upload issue",
      "account": "Account issue",
      "bug": "Bug report",
      "feature": "Feature request",
      "other": "Other"
    },
    "filters": {
      "allStatus": "All statuses",
      "allPriorities": "All priorities"
    },
    "list": {
      "title": "My tickets",
      "createButton": "Create ticket",
      "filterLabel": "Filter by status",
      "waitingCount": "{count} ticket awaiting your reply | {count} tickets awaiting your reply",
      "refresh": "Refresh",
      "loading": "Loading tickets…",
      "empty": "No tickets yet",
      "emptyFiltered": "No tickets with the status “{status}”",
      "showAll": "Show all tickets",
      "total": "{total} ticket in total | {total} tickets in total",
      "columns": {
        "ticket": "Ticket",
        "status": "Status"
      },
      "updatedAt": "Last updated",
      "priorityTag": "{priority} priority",
      "assigned": "Picked up by an admin",
      "createdOn": "Opened {date}",
      "closedOn": "Closed {date}",
      "pagination": {
        "label": "Ticket pages",
        "page": "Page {page} of {total}",
        "prevPage": "Previous page",
        "nextPage": "Next page"
      },
      "toast": {
        "loadFailedTitle": "Failed to load tickets",
        "loadFailedFallback": "Check your connection and try again"
      }
    },
    "create": {
      "backButton": "Back to ticket list",
      "title": "Create ticket",
      "submit": "Submit ticket",
      "submitting": "Submitting...",
      "typeTitle": "Type of issue",
      "contentTitle": "Your issue",
      "count": "{count} / {max}",
      "fields": {
        "subject": "Subject",
        "subjectPlaceholder": "The issue in one sentence, e.g. upload failed",
        "category": "Category",
        "priority": "Priority",
        "priorityHint": "Urgent is only for sign-in, data or core feature issues",
        "message": "Description",
        "messagePlaceholder": "Describe the issue in detail…"
      },
      "guide": {
        "upload": "Include the server, how you uploaded (module, packet capture or transfer code), when it happened and the error",
        "account": "Include the affected account ID, the server, when it happened and the error",
        "bug": "Include the steps, what you expected and what happened, and your device and browser",
        "feature": "Describe what you are trying to do and what gets in the way",
        "other": "Include when it happened, the steps, error messages or related links"
      },
      "tips": {
        "title": "Before you submit",
        "usage": "For how-to and usage questions, ask in the {link} instead.",
        "usageLink": "recommended groups",
        "secrets": "Never put passwords, transfer codes or other secrets in a ticket. Admins will not ask for them."
      },
      "toast": {
        "subjectRequired": "Please enter ticket subject",
        "messageRequired": "Please enter ticket description",
        "subjectTooLong": "Subject must be at most {max} characters",
        "messageTooLong": "Description must be at most {max} characters",
        "loginRequired": "Please sign in first",
        "createSuccess": "Ticket created",
        "createFailedTitle": "Failed to create ticket",
        "createFailedFallback": "The ticket was not created. Try again later."
      }
    },
    "detail": {
      "backButton": "Back to ticket list",
      "prioritySuffix": "priority",
      "createdAt": "Created at {date}",
      "infoTitle": "Ticket details",
      "summary": {
        "category": "Category",
        "priority": "Priority",
        "createdAt": "Created",
        "updatedAt": "Last updated",
        "closedAt": "Closed",
        "ticketId": "Ticket ID"
      },
      "copyId": "Copy ticket ID",
      "idCopied": "Ticket ID copied",
      "copyFailed": "Copy failed",
      "threadTitle": "Conversation",
      "messageCount": "{count} message | {count} messages",
      "showEarlier": "Show {count} earlier message | Show {count} earlier messages",
      "refresh": "Refresh",
      "selfSender": "You",
      "adminSender": "Admin",
      "noMessages": "No messages",
      "replyLabel": "Reply",
      "inputPlaceholder": "Reply to the admin…",
      "composeHint": "Enter to send, Shift+Enter for a new line",
      "reopenHint": "Replying reopens the ticket",
      "replyTooLong": "A reply can be at most {max} characters",
      "sentState": "Sent",
      "sendButton": "Send",
      "closedHint": "This ticket is closed and can no longer receive replies",
      "newTicket": "Create a new ticket",
      "closeButton": "Close ticket",
      "closeDialog": {
        "title": "Confirm close ticket",
        "description": "You cannot reply after closing it",
        "cancel": "Cancel",
        "confirm": "Confirm close"
      },
      "notFound": "Ticket not found",
      "notFoundDescription": "It may have been deleted, or it belongs to another account",
      "toast": {
        "loadFailedTitle": "Failed to load ticket detail",
        "loadFailedFallback": "Check your connection and try again",
        "sendFailedTitle": "Send failed",
        "sendFailedFallback": "Not sent; your text is kept. Try again.",
        "closeSuccess": "Ticket closed",
        "closeFailedTitle": "Close failed",
        "closeFailedFallback": "The ticket was not closed. Try again later."
      }
    },
    "adminList": {
      "title": "Ticket management",
      "description": "Filter pending, unassigned, and high-priority tickets quickly",
      "searchPlaceholder": "Search tickets…",
      "refreshButton": "Refresh",
      "unassigned": "Unassigned",
      "empty": "No tickets",
      "emptyFiltered": "No tickets match these filters",
      "total": "{total} tickets in total",
      "stats": {
        "label": "Ticket statistics",
        "labelCount": "{label} {count}",
        "openDetail": "New, not handled yet",
        "mine": "Assigned to me",
        "totalDetail": "{active} active · {done} done",
        "byStatus": "By status",
        "byPriority": "By priority",
        "byCategory": "By category",
        "scopeAll": "All {total} tickets",
        "scopeAllUnknown": "All tickets",
        "scopePage": "Only the {count} tickets on this page",
        "share": "{count} · {percent}%",
        "empty": "No data",
        "loadFailed": "Could not load the statistics",
        "partialFailed": "Not all statistics could be loaded"
      },
      "quickFilters": {
        "all": "All tickets",
        "pendingAdmin": "Pending admin",
        "pendingUser": "Pending user",
        "unassigned": "Unassigned",
        "mine": "Mine",
        "highOrUrgent": "High priority"
      },
      "table": {
        "subject": "Subject",
        "people": "Creator / assignee",
        "category": "Category",
        "status": "Status",
        "priority": "Priority",
        "creator": "Creator",
        "assignee": "Assignee",
        "lastMessage": "Latest activity",
        "updatedAt": "Updated at"
      },
      "lastMessage": {
        "admin": "Admin",
        "user": "User",
        "system": "System",
        "internal": "Internal",
        "none": "No activity"
      },
      "notifications": {
        "title": "Notifications",
        "label": "Ticket email notifications",
        "description": "Receive new-ticket and user-reply emails",
        "manageButton": "Manage recipients",
        "manageHelp": "Choose which admins receive ticket emails",
        "manageDialogTitle": "Ticket notification recipients",
        "manageDialogDescription": "Choose which admins receive emails for new tickets and user replies. Users only receive emails for public admin replies.",
        "manageDialogSummary": "{total} admin accounts shown",
        "manageRefresh": "Refresh",
        "manageLoading": "Loading recipients…",
        "manageEmpty": "No admin accounts available",
        "manageBannedHint": "This account is banned and will not receive notifications",
        "manageTable": {
          "name": "Admin",
          "role": "Role",
          "email": "Email",
          "enabled": "Receive"
        },
        "loadFailedTitle": "Failed to load notification settings",
        "loadFailedFallback": "Load failed",
        "saveFailedTitle": "Failed to save notification settings",
        "saveFailedFallback": "Save failed",
        "enabledToast": "Ticket email notifications enabled",
        "disabledToast": "Ticket email notifications disabled",
        "manageLoadFailedTitle": "Failed to load notification recipients",
        "manageLoadFailedFallback": "Load failed",
        "manageSaveFailedTitle": "Failed to save recipient setting",
        "manageSaveFailedFallback": "Save failed",
        "manageEnabledToast": "Ticket emails enabled for {name}",
        "manageDisabledToast": "Ticket emails disabled for {name}"
      },
      "toast": {
        "loadFailedTitle": "Failed to load ticket list",
        "loadFailedFallback": "Load failed"
      }
    },
    "adminDetail": {
      "backButton": "Back to ticket list",
      "prioritySuffix": "priority",
      "creator": "User: {creator}",
      "unknownUser": "Unknown",
      "createdAt": "Created at {date}",
      "summary": {
        "category": "Category",
        "priority": "Priority",
        "creator": "Creator",
        "assignee": "Assignee",
        "createdAt": "Created",
        "updatedAt": "Updated",
        "lastMessageAt": "Last message",
        "closedAt": "Closed"
      },
      "viewUser": "View {name}'s user profile",
      "stats": {
        "label": "Conversation at a glance",
        "userMessages": "User messages",
        "adminReplies": "Public replies",
        "internalNotes": "{count} internal notes",
        "firstResponse": "First response time",
        "firstResponseNone": "No reply yet",
        "firstResponseDetail": "Creation to first public reply",
        "waitingAdmin": "User has waited",
        "waitingAdminDetail": "Since the user's last message",
        "waitingUser": "Waiting on the user",
        "waitingUserDetail": "Since the last public reply",
        "closedAfter": "Time to close",
        "closedAfterDetail": "Creation to closing",
        "waitingNone": "Waiting"
      },
      "duration": {
        "days": "{days} d {hours} h",
        "hours": "{hours} h {minutes} min",
        "minutes": "{minutes} min",
        "moment": "Under a minute"
      },
      "system": {
        "statusChanged": "Status changed from {from} to {to}",
        "assigneeChanged": "Assignee changed from {from} to {to}",
        "assigned": "Assigned to {to}",
        "assigneeCleared": "Unassigned (was {from})"
      },
      "actionsTitle": "Ticket actions",
      "actionsDescription": "Update status or assign an admin owner",
      "statusChangeLabel": "Change status",
      "assigneeLabel": "Assignee",
      "assigneePlaceholder": "Select assignee",
      "assigneeLoading": "Loading assignees…",
      "assigneeLoadFailedHint": "Failed to load assignees",
      "retryLoadAssignees": "Retry",
      "unassigned": "Unassigned",
      "assignButton": "Assign",
      "adminSender": "Admin",
      "userSender": "User",
      "systemSender": "System",
      "internalTag": "Internal note",
      "messagesTitle": "Conversation",
      "messagesDescription": "Public replies are visible to users. Internal notes stay admin-only.",
      "noMessages": "No messages",
      "compose": {
        "replyTitle": "Reply to user",
        "internalTitle": "Internal note"
      },
      "internalInputPlaceholder": "Enter internal note (admins only)…",
      "replyInputPlaceholder": "Enter reply…",
      "noteButton": "Note",
      "sendButton": "Send",
      "internalSwitchLabel": "Internal note (admins only)",
      "notFound": "Ticket not found; it may have been deleted or the link is wrong",
      "toast": {
        "loadFailedTitle": "Failed to load ticket detail",
        "loadFailedFallback": "Load failed",
        "sendFailedTitle": "Send failed",
        "sendFailedFallback": "Send failed",
        "statusUpdated": "Status updated to {status}",
        "updateStatusFailedTitle": "Failed to update status",
        "updateStatusFailedFallback": "Update failed",
        "assigned": "Assignee set",
        "unassigned": "Assignee cleared",
        "assignFailedTitle": "Assign failed",
        "assignFailedFallback": "Assign failed",
        "loadAssigneesFailedTitle": "Failed to load assignees",
        "loadAssigneesFailedFallback": "Unable to load assignable admins"
      }
    }
  }
} as const
