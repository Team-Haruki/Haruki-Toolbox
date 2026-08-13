// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: tickets
export default {
  "tickets": {
    "common": {
      "dateFallback": "—"
    },
    "status": {
      "open": "Open",
      "inProgress": "In progress",
      "pendingAdmin": "Pending admin",
      "pendingUser": "Pending user",
      "resolved": "Resolved",
      "closed": "Closed"
    },
    "userStatusHint": {
      "waitingAdmin": "We have received your ticket and it is waiting for an admin response.",
      "waitingUser": "An admin has replied. Please add more details or confirm the next step.",
      "resolved": "This ticket has been marked resolved. Close it if the issue is handled.",
      "closed": "This ticket is closed. Create a new ticket if you have another issue."
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
      "allStatus": "All status",
      "allPriorities": "All priorities"
    },
    "list": {
      "title": "My tickets",
      "description": "Check progress and add details when needed.",
      "createButton": "Create ticket",
      "empty": "No tickets yet. Click the button above to create one.",
      "total": "{total} tickets in total",
      "updatedAt": "Updated",
      "toast": {
        "loadFailedTitle": "Failed to load tickets",
        "loadFailedFallback": "Load failed"
      }
    },
    "create": {
      "backButton": "Back to ticket list",
      "title": "Create ticket",
      "description": "Clear details help admins decide the next step faster.",
      "submit": "Submit ticket",
      "submitting": "Submitting...",
      "fields": {
        "subject": "Subject",
        "subjectPlaceholder": "Briefly describe your issue",
        "subjectHint": "For example: upload failed, cannot bind account, OAuth callback error.",
        "category": "Category",
        "categoryHint": "Pick the closest category. Use Other when unsure.",
        "priority": "Priority",
        "priorityHint": "Use urgent for sign-in, data, or core feature issues.",
        "message": "Description",
        "messagePlaceholder": "Describe your issue in detail…",
        "messageHint": "Include account ID, server, time, steps, error messages, or related links when possible."
      },
      "toast": {
        "subjectRequired": "Please enter ticket subject",
        "messageRequired": "Please enter ticket description",
        "loginRequired": "Please sign in first",
        "createSuccess": "Ticket created",
        "createFailedTitle": "Failed to create ticket",
        "createFailedFallback": "Create failed"
      }
    },
    "detail": {
      "backButton": "Back to ticket list",
      "prioritySuffix": "priority",
      "createdAt": "Created at {date}",
      "summary": {
        "category": "Category",
        "priority": "Priority",
        "createdAt": "Created",
        "updatedAt": "Updated"
      },
      "adminSender": "Admin",
      "noMessages": "No messages",
      "inputPlaceholder": "Add details or reply to the admin…",
      "sendButton": "Send",
      "closedHint": "This ticket is closed and can no longer receive messages",
      "closeButton": "Close ticket",
      "closeDialog": {
        "title": "Confirm close ticket",
        "description": "After closing, you cannot send messages anymore. Continue?",
        "cancel": "Cancel",
        "confirm": "Confirm close"
      },
      "notFound": "Ticket not found or failed to load",
      "toast": {
        "loadFailedTitle": "Failed to load ticket detail",
        "loadFailedFallback": "Load failed",
        "sendFailedTitle": "Send failed",
        "sendFailedFallback": "Send failed",
        "closeSuccess": "Ticket closed",
        "closeFailedTitle": "Close failed",
        "closeFailedFallback": "Close failed"
      }
    },
    "adminList": {
      "pagination": {
        "prevPage": "Previous page",
        "nextPage": "Next page"
      },
      "title": "Ticket management",
      "description": "Filter pending, unassigned, and high-priority tickets quickly.",
      "searchPlaceholder": "Search tickets…",
      "refreshButton": "Refresh",
      "unassigned": "Unassigned",
      "empty": "No tickets",
      "total": "{total} tickets in total",
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
        "label": "Ticket email notifications",
        "description": "Receive new-ticket and user-reply emails",
        "manageButton": "Manage recipients",
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
        "updatedAt": "Updated"
      },
      "actionsTitle": "Ticket actions",
      "actionsDescription": "Update status or assign an admin owner.",
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
      "notFound": "Ticket not found or failed to load",
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
