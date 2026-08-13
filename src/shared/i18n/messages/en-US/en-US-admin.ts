// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: admin, adminConfig, adminRisk, adminContent, adminOAuthClients, adminWebhooks, adminSponsors, adminStatistics, adminGameBindings, adminUsers
export default {
  "admin": {
    "layout": {
      "superAdmin": "Super admin"
    },
    "nav": {
      "groups": {
        "overview": "Overview",
        "usersRisk": "Users & Risk",
        "operations": "Content & Operations",
        "system": "System & Integrations"
      },
      "descriptions": {
        "dashboard": "Key platform metrics and upload trends at a glance.",
        "users": "Browse, search and manage toolbox users.",
        "gameBindings": "Query and adjust user game-account bindings.",
        "risk": "Maintain risk rules and handle risk events.",
        "tickets": "Handle user tickets and replies.",
        "content": "Maintain friend links, recommended groups and other site content.",
        "sponsors": "Manage how the sponsor list is displayed.",
        "uploadLogs": "Track player data uploads and failure causes.",
        "logs": "Inspect system logs.",
        "oauthClients": "Manage OAuth clients, secrets and callbacks.",
        "webhooks": "Manage platform webhook deliveries.",
        "config": "Adjust system-level configuration (super admins only)."
      },
      "dashboard": "Dashboard",
      "users": "Users",
      "oauthClients": "OAuth clients",
      "webhooks": "Webhooks",
      "logs": "System logs",
      "uploadLogs": "Upload logs",
      "content": "Content",
      "sponsors": "Sponsors",
      "config": "System config",
      "gameBindings": "Game bindings",
      "risk": "Risk control",
      "tickets": "Tickets",
      "pendingTickets": "{total} tickets pending admin action"
    }
  },
  "adminConfig": {
    "publicApiKeys": {
      "title": "Public API Keys",
      "description": "Manage public API key configuration (super admins only)."
    },
    "runtime": {
      "title": "Runtime configuration",
      "description": "Manage runtime configuration. Changes take effect immediately.",
      "saveDialogTitle": "Apply runtime configuration?",
      "saveDialogDescription": "This change takes effect immediately and applies system-wide. Make sure the JSON is correct before continuing.",
      "saveDialogConfirm": "Apply"
    },
    "toast": {
      "loadApiKeysFailedTitle": "Failed to load Public API Keys",
      "loadRuntimeFailedTitle": "Failed to load runtime configuration",
      "loadFailedFallback": "Load failed",
      "apiKeysUpdated": "Public API Keys updated",
      "runtimeUpdated": "Runtime configuration updated",
      "invalidJson": "Invalid JSON format",
      "invalidApiKeysSchema": "Public API Keys must be a JSON object of string values",
      "invalidRuntimeSchema": "Runtime configuration must be a JSON object",
      "saveFailedTitle": "Failed to save",
      "saveFailedFallback": "Save failed"
    },
    "loadError": "Failed to load configuration",
    "retry": "Retry",
    "unsavedChanges": "Unsaved changes"
  },
  "adminRisk": {
    "tabs": {
      "events": "Risk events",
      "rules": "Risk rules"
    },
    "common": {
      "fallback": "—"
    },
    "severity": {
      "low": "Low",
      "medium": "Medium",
      "high": "High",
      "critical": "Critical"
    },
    "status": {
      "open": "Open",
      "resolved": "Resolved"
    },
    "events": {
      "pagination": {
        "prev": "Previous page",
        "next": "Next page"
      },
      "title": "Risk events",
      "createButton": "Create event",
      "createDialogTitle": "Create risk event",
      "create": "Create",
      "resolveAction": "Mark as resolved",
      "empty": "No risk events",
      "total": "{total} events in total",
      "fields": {
        "severity": "Severity",
        "source": "Source",
        "action": "Action",
        "reason": "Reason",
        "targetUserIdOptional": "Target user ID (optional)"
      },
      "placeholders": {
        "source": "e.g. dashboard",
        "action": "e.g. suspicious_login",
        "reason": "Describe the risk reason…",
        "targetUserId": "User ID"
      },
      "table": {
        "severity": "Severity",
        "action": "Action",
        "reason": "Reason",
        "user": "User",
        "status": "Status",
        "time": "Time",
        "actions": "Actions"
      }
    },
    "rules": {
      "title": "Risk rules",
      "description": "View and edit risk rules (super admins only).",
      "saveButton": "Save rules",
      "superAdminOnly": "Risk rules are only available to super admins.",
      "loadError": "Failed to load risk rules.",
      "retry": "Retry"
    },
    "toast": {
      "loadEventsFailedTitle": "Failed to load risk events",
      "loadRulesFailedTitle": "Failed to load risk rules",
      "loadFailedFallback": "Load failed",
      "actionReasonRequired": "Please enter action and reason",
      "createSuccess": "Event created",
      "createFailedTitle": "Create failed",
      "createFailedFallback": "Create failed",
      "resolveSuccess": "Event resolved",
      "actionFailedTitle": "Action failed",
      "actionFailedFallback": "Action failed",
      "saveFailedTitle": "Save failed",
      "saveFailedFallback": "Save failed",
      "rulesMustBeJsonArray": "Rules content must be a JSON array",
      "rulesUpdated": "Risk rules updated",
      "invalidJson": "Invalid JSON format"
    }
  },
  "adminContent": {
    "actions": {
      "edit": "Edit",
      "delete": "Delete"
    },
    "tabs": {
      "links": "Friend links",
      "groups": "Recommended groups"
    },
    "linksTab": {
      "title": "Friend links",
      "createButton": "Add friend link",
      "table": {
        "sortOrder": "Order",
        "name": "Name",
        "url": "URL",
        "tags": "Tags",
        "actions": "Actions"
      },
      "deleteDialog": {
        "title": "Confirm delete",
        "description": "Delete friend link {name}?",
        "cancel": "Cancel",
        "confirm": "Confirm"
      },
      "empty": "No friend links"
    },
    "groupsTab": {
      "title": "Recommended groups",
      "createGroupButton": "Create group",
      "createGroupDialog": {
        "title": "Create group",
        "editTitle": "Edit group",
        "groupNameLabel": "Group name",
        "groupNamePlaceholder": "Group name",
        "create": "Save"
      },
      "addItemButton": "Add item",
      "deleteGroupDialog": {
        "title": "Confirm group deletion",
        "description": "Delete group {group}? All items in this group will also be deleted.",
        "cancel": "Cancel",
        "confirm": "Confirm"
      },
      "emptyItems": "No group items",
      "emptyGroups": "No groups"
    },
    "linkDialog": {
      "createTitle": "Add friend link",
      "editTitle": "Edit friend link",
      "fields": {
        "name": "Name",
        "description": "Description",
        "avatarUrl": "Avatar URL",
        "linkUrl": "Link URL",
        "tags": "Tags (comma separated)",
        "sortOrder": "Sort order",
        "sortOrderHint": "Lower values appear first; ties break by ID."
      },
      "placeholders": {
        "name": "Site name",
        "description": "Short description",
        "avatarUrl": "https://example.com/avatar.png",
        "linkUrl": "https://example.com",
        "tags": "Blog, Tech",
        "sortOrder": "0"
      }
    },
    "itemDialog": {
      "createTitle": "Add item",
      "editTitle": "Edit item",
      "fields": {
        "name": "Name",
        "avatarUrl": "Avatar URL",
        "backgroundUrl": "Background URL",
        "groupInfo": "Group info",
        "detail": "Detail"
      },
      "placeholders": {
        "name": "Item name",
        "avatarUrl": "https://example.com/avatar.png",
        "backgroundUrl": "https://example.com/background.jpg",
        "optional": "Optional"
      }
    },
    "toast": {
      "loadLinksFailedTitle": "Failed to load friend links",
      "loadGroupsFailedTitle": "Failed to load friend groups",
      "actionFailedFallback": "Action failed",
      "nameUrlRequired": "Please enter name and URL",
      "invalidLinkUrl": "Please enter a valid http(s) URL",
      "saveFailedTitle": "Save failed",
      "createFailedTitle": "Create failed",
      "deleteFailedTitle": "Delete failed",
      "linkUpdated": "Friend link updated",
      "linkCreated": "Friend link created",
      "linkDeleted": "Friend link deleted",
      "groupNameRequired": "Please enter group name",
      "groupCreated": "Group created",
      "groupUpdated": "Group updated",
      "groupDeleted": "Group deleted",
      "itemNameRequired": "Please enter name",
      "itemUpdated": "Item updated",
      "itemCreated": "Item created",
      "itemDeleted": "Item deleted"
    }
  },
  "adminOAuthClients": {
    "title": "OAuth client management",
    "scope": {
      "userRead": "Basic profile (user:read)",
      "bindingsRead": "Game bindings (bindings:read)",
      "gameDataRead": "Game data (game-data:read)",
      "gameDataWrite": "Game upload (game-data:write)",
      "offlineAccess": "Offline access / refresh tokens (offline_access)"
    },
    "common": {
      "fallback": "—",
      "empty": "No statistics available"
    },
    "status": {
      "deleted": "Deleted",
      "enabled": "Enabled",
      "disabled": "Disabled"
    },
    "createDialog": {
      "trigger": "Create client",
      "title": "Create OAuth client",
      "description": "Create a new OAuth2 client application",
      "clientIdLabel": "Client ID",
      "clientIdPlaceholder": "Letters, numbers, dashes, and underscores",
      "submit": "Create"
    },
    "editDialog": {
      "title": "Edit OAuth client",
      "descriptionPrefix": "Update settings for client",
      "descriptionSuffix": ".",
      "cancel": "Cancel"
    },
    "form": {
      "removeRedirectUri": "Remove URI",
      "nameLabel": "Client name",
      "namePlaceholder": "Display name",
      "clientTypeLabel": "Client type",
      "clientTypePlaceholder": "Select type",
      "clientTypeConfidential": "Confidential (with secret)",
      "clientTypePublic": "Public (no secret)",
      "scopesLabel": "Scopes",
      "redirectUrisLabel": "Redirect URIs",
      "redirectUriPlaceholder": "https://example.com/callback",
      "addRedirectUri": "Add URI"
    },
    "table": {
      "clientId": "Client ID",
      "name": "Name",
      "redirectUris": "Redirect URIs",
      "status": "Status",
      "createdAt": "Created at",
      "actions": "Actions",
      "publicTag": "Public",
      "openMenu": "Open menu",
      "empty": "No OAuth clients",
      "menu": {
        "edit": "Edit",
        "stats": "View stats",
        "webhooks": "Webhook endpoints",
        "disableClient": "Disable client",
        "enableClient": "Enable client",
        "dangerZone": "Danger zone",
        "rotateSecret": "Rotate secret",
        "revokeAll": "Revoke all authorizations",
        "restore": "Restore",
        "deleteClient": "Delete client"
      }
    },
    "deleteDialog": {
      "title": "Confirm delete",
      "descriptionPrefix": "Delete OAuth client",
      "descriptionSuffix": "?",
      "cancel": "Cancel",
      "confirm": "Confirm"
    },
    "rotateDialog": {
      "title": "Rotate client secret",
      "description": "Rotate the secret for client {clientId}? The current secret will be invalidated immediately and existing integrations will break until updated.",
      "cancel": "Cancel",
      "confirm": "Rotate"
    },
    "revokeDialog": {
      "title": "Revoke all authorizations",
      "description": "Revoke all user authorizations for client {clientId}? Every user will need to authorize again. This cannot be undone.",
      "cancel": "Cancel",
      "confirm": "Revoke all"
    },
    "statsDialog": {
      "title": "Client statistics",
      "from": "Start time",
      "to": "End time",
      "bucket": "Bucket",
      "hour": "Hour",
      "day": "Day",
      "apply": "Apply",
      "invalidTimeRange": "Start time cannot be later than end time",
      "totalAuthorizations": "Total authorizations",
      "activeAuthorizations": "Active authorizations",
      "last30Days": "Last 30 days"
    },
    "secretDialog": {
      "title": "Credential generated",
      "description": "Client Secret is shown only once and will not be stored in plaintext. Copy and store it securely now; if lost, regenerate it.",
      "copy": "Copy",
      "confirmSaved": "I've saved it securely"
    },
    "webhooks": {
      "title": "OAuth client webhooks",
      "description": "Manage data update notification endpoints for client {clientId}.",
      "placeholderHint": "Callback URLs support {server}, {data_type}, and {user_id} placeholders.",
      "actions": {
        "refresh": "Refresh",
        "create": "Create endpoint",
        "cancel": "Cancel",
        "save": "Save"
      },
      "bearer": {
        "configured": "Configured",
        "empty": "Not configured"
      },
      "table": {
        "callbackUrl": "Callback URL",
        "bearer": "Bearer",
        "status": "Status",
        "createdAt": "Created at",
        "actions": "Actions",
        "empty": "No OAuth client webhook endpoints"
      },
      "form": {
        "createTitle": "Create webhook endpoint",
        "editTitle": "Edit webhook endpoint",
        "description": "Bearer values are not shown again; leave empty to keep the current value.",
        "callbackUrl": "Callback URL",
        "callbackUrlPlaceholder": "https://example.com/oauth-webhook/{server}/{data_type}/{user_id}",
        "bearer": "Bearer token",
        "bearerPlaceholder": "Optional",
        "bearerReplacePlaceholder": "Leave empty to keep current bearer",
        "bearerHelp": "After saving, the frontend only shows whether a bearer is configured.",
        "enabled": "Enable endpoint",
        "enabledHelp": "Disabled endpoints will not receive callbacks.",
        "clearBearer": "Clear configured bearer",
        "clearBearerHelp": "When enabled, saving removes the current bearer."
      },
      "validation": {
        "callbackUrlRequired": "Callback URL is required"
      },
      "deleteDialog": {
        "title": "Delete webhook endpoint",
        "description": "Delete the webhook endpoint {callbackUrl}? It will stop receiving callbacks. You can recreate it later.",
        "cancel": "Cancel",
        "confirm": "Delete"
      }
    },
    "toast": {
      "loadClientsFailedTitle": "Failed to load OAuth clients",
      "loadStatsFailedTitle": "Failed to load statistics",
      "loadAuthorizationsFailedTitle": "Failed to load OAuth client authorizations",
      "loadAuditLogsFailedTitle": "Failed to load OAuth client audit logs",
      "loadWebhooksFailedTitle": "Failed to load OAuth client webhooks",
      "actionFailedFallback": "Action failed",
      "createFailedTitle": "Create failed",
      "saveFailedTitle": "Save failed",
      "saveWebhookFailedTitle": "Failed to save webhook",
      "deleteFailedTitle": "Delete failed",
      "deleteWebhookFailedTitle": "Failed to delete webhook",
      "actionFailedTitle": "Action failed",
      "rotateFailedTitle": "Rotate failed",
      "restoreFailedTitle": "Restore failed",
      "revokeFailedTitle": "Revoke failed",
      "clientCreated": "OAuth client created",
      "saved": "Saved",
      "deleted": "Deleted",
      "disabled": "Disabled",
      "enabled": "Enabled",
      "secretRotated": "Secret regenerated successfully",
      "restored": "Restored",
      "revokedAll": "All authorizations revoked",
      "webhookSaved": "Webhook endpoint saved",
      "webhookDeleted": "Webhook endpoint deleted",
      "copyFailedTitle": "Copy failed",
      "copyFailedSecretEmpty": "Secret is empty",
      "copyFailedClipboardUnsupported": "Clipboard is not supported in this environment",
      "copied": "Copied to clipboard",
      "validation": {
        "clientIdAndNameRequired": "Client ID and name are required",
        "nameRequired": "Client name is required",
        "redirectUriRequired": "Please provide at least one redirect URI",
        "scopeRequired": "Please select at least one scope"
      }
    }
  },
  "adminWebhooks": {
    "common": {
      "fallback": "—"
    },
    "status": {
      "enabled": "Enabled",
      "disabled": "Disabled",
      "configured": "Configured",
      "notConfigured": "Not configured"
    },
    "actions": {
      "refresh": "Refresh",
      "create": "Create endpoint",
      "edit": "Edit",
      "delete": "Delete",
      "subscribers": "Subscribers",
      "copyToken": "Copy token",
      "cancel": "Cancel"
    },
    "settings": {
      "title": "Webhook settings",
      "description": "Manage global webhook delivery and JWT secret configuration.",
      "globalStatus": "Global delivery status",
      "globalStatusHint": "Both the global switch and endpoint switch must be enabled before callbacks are sent.",
      "jwtSecretStatus": "JWT secret status",
      "jwtSecretStatusHint": "Webhook subscription tokens are available only after the secret is configured.",
      "secretAlertTitle": "JWT secret is not configured",
      "secretAlertDescription": "You can still create and edit endpoints, but the backend will not return a usable webhook token until a JWT secret is configured.",
      "enableSwitchLabel": "Enable webhook delivery globally",
      "jwtSecretLabel": "Webhook JWT secret",
      "jwtSecretPlaceholder": "Leave empty to keep the current secret",
      "jwtSecretHelp": "Only enter a value when you want to replace the current JWT secret.",
      "readOnlyNoticeTitle": "Read-only view",
      "readOnlyNoticeDescription": "You can view webhook settings and endpoints, but modifying them requires super-admin permission."
    },
    "list": {
      "title": "Webhook endpoints",
      "description": "View and manage registered webhook callback endpoints.",
      "generatedAt": "Generated at {date}",
      "total": "{total} endpoints"
    },
    "table": {
      "id": "ID",
      "callbackUrl": "Callback URL",
      "credential": "Credential",
      "status": "Status",
      "subscriptions": "Subscriptions",
      "createdAt": "Created at",
      "actions": "Actions",
      "empty": "No webhook endpoints"
    },
    "form": {
      "createTitle": "Create webhook endpoint",
      "editTitle": "Edit webhook endpoint",
      "description": "Configure callback address, credential, bearer token, and endpoint status.",
      "idLabel": "Endpoint ID",
      "idPlaceholder": "Optional. Leave empty to auto-generate",
      "idHelp": "If left empty, the backend will generate the next numeric ID automatically.",
      "callbackUrlLabel": "Callback URL",
      "callbackUrlPlaceholder": "https://example.com/webhook",
      "credentialLabel": "Credential",
      "credentialPlaceholder": "Optional. Leave empty to auto-generate",
      "credentialHelp": "If left empty, the backend will generate a random credential.",
      "bearerLabel": "Bearer token",
      "bearerPlaceholder": "Optional. Leave empty for no Authorization header",
      "bearerHelp": "When set, the backend will send `Authorization: Bearer TOKEN` on callback requests.",
      "clearBearerLabel": "Clear bearer token",
      "enabledLabel": "Enable this endpoint"
    },
    "deleteDialog": {
      "title": "Delete webhook endpoint",
      "description": "Delete endpoint {id}? This also removes all subscriber relationships bound to this endpoint.",
      "confirm": "Delete endpoint"
    },
    "tokenDialog": {
      "title": "Webhook token",
      "description": "Save the current webhook token for endpoint {id}.",
      "headerNameLabel": "Header name",
      "tokenLabel": "Webhook token",
      "tokenHelp": "This token is used when calling webhook subscriber APIs. Store it securely.",
      "close": "Close"
    },
    "subscribers": {
      "title": "Subscribers for {id}",
      "description": "These subscriber bindings will receive callbacks from this endpoint when both switches are enabled.",
      "generatedAt": "Generated at {date}",
      "userId": "User ID",
      "server": "Server",
      "dataType": "Data type",
      "createdAt": "Created at",
      "empty": "No subscribers bound to this endpoint"
    },
    "toast": {
      "loadFailedFallback": "Operation failed",
      "loadSettingsFailedTitle": "Failed to load webhook settings",
      "saveSettingsFailedTitle": "Failed to save webhook settings",
      "loadEndpointsFailedTitle": "Failed to load webhook endpoints",
      "loadSubscribersFailedTitle": "Failed to load subscribers",
      "createFailedTitle": "Failed to create endpoint",
      "saveFailedTitle": "Failed to save endpoint",
      "deleteFailedTitle": "Failed to delete endpoint",
      "settingsSaved": "Webhook settings saved",
      "created": "Webhook endpoint created",
      "saved": "Webhook endpoint saved",
      "deleted": "Webhook endpoint deleted",
      "savedWithoutToken": "Endpoint saved. No token was returned because the JWT secret is not configured.",
      "copyFailedTitle": "Failed to copy token",
      "copyFailedEmpty": "Token is empty",
      "copyFailedClipboardUnsupported": "Clipboard is not supported in this environment",
      "copied": "Token copied to clipboard",
      "validation": {
        "callbackRequired": "Callback URL is required",
        "callbackInvalid": "Callback URL must be a valid http or https URL",
        "idInvalid": "Endpoint ID cannot contain a slash",
        "credentialInvalid": "Credential cannot contain a slash",
        "jwtSecretInvalid": "JWT secret cannot be an empty string"
      }
    }
  },
  "adminSponsors": {
    "title": "Sponsor management",
    "description": "Maintain public sponsor profiles and control whether manual profile edits may be overwritten by Afdian sync.",
    "generatedAt": "Generated at {date}",
    "common": {
      "fallback": "—",
      "anonymous": "Anonymous supporter"
    },
    "contribution": {
      "amount": "¥{amount}",
      "month": "{count} mo"
    },
    "actions": {
      "refresh": "Refresh list",
      "syncAfdian": "Sync from Afdian",
      "edit": "Edit profile"
    },
    "stats": {
      "total": "Total sponsors",
      "active": "Currently supporting",
      "manualProfile": "Protected profiles"
    },
    "status": {
      "active": "Currently supporting",
      "past": "Past support"
    },
    "afdianSync": {
      "enabled": "Allow updates",
      "disabled": "Do not update from Afdian"
    },
    "list": {
      "title": "Sponsor list",
      "description": "Rows follow the backend order. Edit public profiles here or protect manual profile data."
    },
    "table": {
      "supporter": "Supporter",
      "tier": "Tier",
      "status": "Status",
      "source": "Source",
      "lastSupport": "Last support",
      "contribution": "Contribution",
      "afdianSync": "Afdian updates",
      "actions": "Actions",
      "empty": "No sponsor records yet"
    },
    "edit": {
      "title": "Edit sponsor profile",
      "name": "Display name",
      "avatar": "Avatar URL",
      "avatarPlaceholder": "https://example.com/avatar.png",
      "planName": "Sponsor tier",
      "source": "Source",
      "paidAt": "Last support time",
      "planExpiresAt": "Support expires at",
      "message": "Message",
      "isActive": "Mark as currently supporting",
      "afdianSyncDisabled": "Do not update this profile from Afdian",
      "afdianSyncHelp": "When enabled, manually edited name, avatar, tier, and message should not be overwritten by later Afdian syncs.",
      "manualProfileHint": "This only saves display profile data and sync policy. Afdian API keys and webhook configuration should remain backend-only."
    },
    "toast": {
      "actionFailedFallback": "Operation failed",
      "loadFailedTitle": "Failed to load sponsors",
      "saveFailedTitle": "Failed to save sponsor",
      "syncFailedTitle": "Failed to sync from Afdian",
      "saved": "Sponsor profile saved",
      "synced": "Afdian sync requested",
      "afdianSyncDisabled": "Afdian updates disabled for this profile",
      "afdianSyncEnabled": "Afdian updates allowed for this profile",
      "validation": {
        "nameRequired": "Display name is required"
      }
    }
  },
  "adminStatistics": {
    "common": {
      "fallback": "—",
      "success": "Success",
      "failure": "Failure"
    },
    "dashboard": {
      "stat": {
        "totalUsers": "Total users",
        "superAdmin": "Super admins",
        "totalBindings": "Game bindings",
        "totalUploads": "Total uploads (all time)"
      },
      "upload24h": {
        "total": "24h total uploads",
        "bannedUsers": "Banned users"
      },
      "chart": {
        "title": "Trend chart",
        "description": "Registration and upload trends",
        "uploads": "Uploads",
        "registrations": "Registrations",
        "failures": "Failures",
        "successRate": "Success rate",
        "range7d": "Last 7 days",
        "range30d": "Last 30 days",
        "range90d": "Last 90 days",
        "bucketDay": "Daily",
        "bucketWeek": "Weekly",
        "bucketMonth": "Monthly",
        "empty": "No data"
      },
      "toast": {
        "loadFailedTitle": "Failed to load dashboard",
        "loadChartFailedTitle": "Failed to load chart",
        "loadFailedFallback": "Load failed"
      }
    },
    "systemLogs": {
      "pagination": {
        "prev": "Previous page",
        "next": "Next page",
        "total": "{total} logs in total"
      },
      "summary": {
        "total": "Total logs"
      },
      "searchPlaceholder": "Search logs…",
      "exportButton": "Export",
      "table": {
        "result": "Result",
        "action": "Action",
        "request": "Method",
        "user": "User",
        "time": "Time",
        "empty": "No logs"
      },
      "detail": {
        "title": "Log detail",
        "result": "Result",
        "time": "Time",
        "action": "Action",
        "request": "Request",
        "user": "User",
        "detail": "Detail"
      },
      "toast": {
        "loadFailedTitle": "Failed to load logs",
        "loadSummaryFailedTitle": "Failed to load log summary",
        "loadDetailFailedTitle": "Failed to load detail",
        "loadFailedFallback": "Load failed",
        "exportSuccess": "Export successful",
        "exportFailedTitle": "Export failed",
        "exportFailedFallback": "Export failed"
      }
    },
    "uploadLogs": {
      "pagination": {
        "prev": "Previous page",
        "next": "Next page",
        "total": "{total} records in total"
      },
      "filters": {
        "title": "Filters",
        "expand": "Expand",
        "collapse": "Collapse",
        "from": "Start time",
        "fromPlaceholder": "Select start time",
        "to": "End time",
        "toPlaceholder": "Select end time",
        "gameUid": "Game UID",
        "gameUidPlaceholder": "Separate multiple UIDs with commas",
        "method": "Upload method",
        "dataType": "Data type",
        "server": "Server",
        "status": "Upload status",
        "sort": "Sort",
        "sortPlaceholder": "Sort order",
        "allMethods": "All methods",
        "allDataTypes": "All data types",
        "allServers": "All servers",
        "allStatuses": "All statuses"
      },
      "actions": {
        "search": "Search"
      },
      "timeRangeLabel": "Time range:",
      "table": {
        "status": "Status",
        "user": "User",
        "server": "Server",
        "method": "Method",
        "dataType": "Data type",
        "error": "Error",
        "viewError": "View error",
        "time": "Time",
        "empty": "No upload logs"
      },
      "errorDialog": {
        "title": "Upload failure detail",
        "description": "Review the backend error message returned for this failed upload.",
        "close": "Close"
      },
      "summary": {
        "totalUploads": "Total uploads",
        "successRate": "Success rate"
      },
      "charts": {
        "successRateDistribution": "Success rate distribution",
        "byMethod": "By upload method",
        "byDataType": "By data type",
        "total": "Total"
      },
      "method": {
        "manual": "Manual upload",
        "iosProxy": "iOS proxy",
        "iosScript": "iOS script",
        "harukiProxy": "HarukiProxy",
        "inherit": "Transfer code"
      },
      "dataType": {
        "suite": "Suite",
        "mysekai": "MySekai"
      },
      "sort": {
        "uploadTimeDesc": "Upload time ↓",
        "uploadTimeAsc": "Upload time ↑",
        "idDesc": "ID ↓",
        "idAsc": "ID ↑"
      },
      "toast": {
        "loadFailedTitle": "Failed to load upload logs",
        "loadFailedFallback": "Load failed",
        "filterFailedTitle": "Filter failed",
        "invalidTimeRange": "Start time cannot be later than end time"
      }
    }
  },
  "adminGameBindings": {
    "pagination": {
      "prevPage": "Previous page",
      "nextPage": "Next page"
    },
    "common": {
      "cancel": "Cancel",
      "create": "Create"
    },
    "filters": {
      "title": "Search and filters",
      "addButton": "Add binding",
      "fuzzySearch": "Fuzzy search",
      "fuzzySearchPlaceholder": "Game ID / Username / Email",
      "exactGameId": "Exact game ID",
      "exactGameIdPlaceholder": "Game user ID",
      "toolboxUserId": "Toolbox user ID",
      "toolboxUserIdPlaceholder": "Toolbox user ID",
      "server": "Server",
      "allServers": "All servers",
      "sort": "Sort",
      "sortPlaceholder": "Sort option",
      "searchButton": "Search"
    },
    "sort": {
      "idDesc": "ID ↓",
      "idAsc": "ID ↑",
      "gameUserIdDesc": "Game ID ↓",
      "gameUserIdAsc": "Game ID ↑",
      "userIdDesc": "User ID ↓",
      "userIdAsc": "User ID ↑"
    },
    "table": {
      "selectAll": "Select all",
      "selectRow": "Select row",
      "selectedCount": "{count} selected",
      "batchUnbind": "Batch unbind",
      "openMenu": "Open menu",
      "total": "{total} records in total",
      "empty": "No game account bindings",
      "columns": {
        "server": "Server",
        "gameId": "Game ID",
        "user": "Owner",
        "actions": "Actions"
      },
      "menu": {
        "edit": "Edit",
        "reassign": "Reassign",
        "unbind": "Unbind"
      },
      "batchDialog": {
        "title": "Confirm batch unbind",
        "description": "Unbind {count} selected game account bindings. This cannot be undone.",
        "cancel": "Cancel",
        "confirm": "Confirm unbind"
      }
    },
    "editDialog": {
      "createTitle": "Add game binding",
      "createDescription": "Add a new game account binding for this user.",
      "editTitle": "Edit game binding",
      "editDescription": "Update privacy settings for this game account binding.",
      "toolboxUserId": "Toolbox user ID",
      "toolboxUserIdPlaceholder": "Enter toolbox user ID",
      "server": "Server",
      "gameUserId": "Game user ID",
      "gameUserIdPlaceholder": "Enter in-game user ID",
      "suiteSettingsTitle": "Suite settings",
      "mysekaiSettingsTitle": "MySekai settings"
    },
    "reassignDialog": {
      "title": "Reassign game account",
      "description": "Move {server} game ID {gameId} from {fromUser} to the target user.",
      "targetUserIdLabel": "Target user ID",
      "targetUserIdPlaceholder": "Enter target toolbox user ID",
      "confirm": "Confirm reassign"
    },
    "deleteDialog": {
      "title": "Confirm unbind",
      "description": "This will unbind game account {gameUserId} on {server}.",
      "confirm": "Confirm unbind"
    },
    "toast": {
      "loadFailedTitle": "Failed to load game bindings",
      "loadFailedFallback": "Load failed",
      "unbound": "Unbound",
      "unbindFailedTitle": "Unbind failed",
      "reassigned": "Reassigned",
      "reassignFailedTitle": "Reassign failed",
      "batchUnbindFailedTitle": "Batch unbind failed",
      "invalidSelectedRecords": "Selected records are invalid",
      "batchUnbound": "{count} bindings unbound",
      "bindingUpdated": "Binding updated",
      "bindingCreated": "Binding created",
      "saveFailedTitle": "Save failed"
    }
  },
  "adminUsers": {
    "role": {
      "user": "User",
      "admin": "Admin",
      "superAdmin": "Super admin"
    },
    "status": {
      "normal": "Normal",
      "banned": "Banned",
      "deleted": "Deleted"
    },
    "common": {
      "actions": "Actions",
      "allowed": "Allowed",
      "denied": "Denied",
      "verified": "Verified",
      "unverified": "Unverified",
      "success": "Success",
      "failed": "Failed",
      "edit": "Edit",
      "save": "Save",
      "cancel": "Cancel",
      "confirm": "Confirm",
      "unbound": "Not bound",
      "openMenu": "Open menu"
    },
    "management": {
      "title": "User management",
      "filters": {
        "searchLabel": "Search",
        "searchPlaceholder": "Search username, email, or ID…",
        "roleLabel": "Role",
        "roleAll": "All",
        "statusLabel": "Account status",
        "statusAll": "All",
        "allowCNLabel": "CN MySekai permission",
        "allowCNAll": "All",
        "sortLabel": "Sort",
        "sortIdDesc": "ID ↓",
        "sortIdAsc": "ID ↑",
        "sortNameDesc": "Name ↓",
        "sortNameAsc": "Name ↑",
        "sortCreatedAtDesc": "Created time ↓",
        "sortCreatedAtAsc": "Created time ↑",
        "createdFromLabel": "Created from",
        "createdFromPlaceholder": "Filter by start time",
        "createdToLabel": "Created to",
        "createdToPlaceholder": "Filter by end time"
      },
      "batch": {
        "selectedCount": "{count} users selected",
        "banButton": "Batch ban",
        "banDialogTitle": "Confirm batch ban",
        "banDialogDescription": "Ban {count} selected users? This action can be reverted.",
        "banDialogConfirm": "Confirm ban",
        "unbanButton": "Batch unban",
        "forceLogoutButton": "Batch logout",
        "roleButton": "Batch role",
        "roleTitle": "Change role for selected users",
        "rolePlaceholder": "Select target role",
        "roleConfirm": "Confirm",
        "allowCNButton": "Batch CN MySekai permission",
        "allowCNTitle": "Change CN MySekai permission for selected users",
        "allowCNPlaceholder": "Select permission state",
        "allowCNEnable": "Allow CN features",
        "allowCNDisable": "Disable CN features",
        "allowCNConfirm": "Confirm",
        "forceLogoutDialogTitle": "Confirm batch logout",
        "forceLogoutDialogDescription": "Force logout for {count} selected users? Their active sessions will be invalidated.",
        "forceLogoutDialogConfirm": "Confirm logout",
        "roleDialogTitle": "Confirm role change",
        "roleDialogDescription": "Change the role of {count} selected users to {role}?",
        "roleDialogConfirm": "Confirm change"
      },
      "pagination": {
        "prevPage": "Previous page",
        "nextPage": "Next page",
        "totalUsers": "{total} users in total",
        "pageSize": "Per page",
        "jumpToPage": "Jump to page",
        "firstPage": "First page",
        "lastPage": "Last page"
      },
      "table": {
        "columns": {
          "username": "Username",
          "email": "Email",
          "role": "Role",
          "allowCN": "CN MySekai permission",
          "status": "Account status",
          "createdAt": "Created at"
        },
        "empty": "No users found",
        "loadError": "Failed to load user list",
        "retry": "Retry"
      },
      "toast": {
        "loadFailedTitle": "Failed to load user list",
        "loadFailedFallback": "Load failed",
        "batchBanSuccess": "Banned {count} users",
        "batchBanFailedTitle": "Batch ban failed",
        "batchBanFailedFallback": "Batch ban failed",
        "batchUnbanSuccess": "Unbanned {count} users",
        "batchUnbanFailedTitle": "Batch unban failed",
        "batchUnbanFailedFallback": "Batch unban failed",
        "batchForceLogoutSuccess": "Forced logout for {count} users",
        "batchForceLogoutFailedTitle": "Batch force logout failed",
        "batchForceLogoutFailedFallback": "Batch force logout failed",
        "batchRoleSuccess": "Updated roles for {count} users",
        "batchRoleFailedTitle": "Batch role update failed",
        "batchRoleFailedFallback": "Batch role update failed",
        "batchAllowCNSuccess": "Updated CN permissions for {count} users",
        "batchAllowCNFailedTitle": "Batch permission update failed",
        "batchAllowCNFailedFallback": "Batch permission update failed"
      }
    },
    "detail": {
      "backToList": "Back to user list",
      "notFound": "User not found or failed to load",
      "tabs": {
        "info": "Basic info",
        "activity": "Activity logs",
        "oauth": "OAuth authorizations",
        "game": "Game bindings",
        "social": "Social platform",
        "authSocial": "Authorized social",
        "ios": "iOS upload code"
      },
      "info": {
        "role": "Role",
        "accountStatus": "Account status",
        "email": "Email",
        "registeredAt": "Created at",
        "comingSoon": "In progress...",
        "changeRole": "Change role:",
        "allowCNFeature": "Allow CN MySekai feature",
        "unban": "Unban",
        "ban": "Ban",
        "banDialogTitle": "Confirm ban",
        "banDialogDescription": "Ban user {name}?",
        "forceLogout": "Force logout",
        "resetPassword": "Reset password",
        "restore": "Restore",
        "delete": "Delete",
        "deleteDialogTitle": "Confirm delete",
        "deleteDialogDescription": "This is a soft delete and can be restored. Delete user {name}?",
        "deleteDialogConfirm": "Confirm delete"
      },
      "activity": {
        "title": "Activity logs",
        "uploadLogsTitle": "Upload logs",
        "uploadLogsDescription": "Recent upload attempts for this user, including backend failure details.",
        "columns": {
          "action": "Action",
          "result": "Result",
          "path": "Path",
          "time": "Time"
        },
        "empty": "No activity logs"
      },
      "oauth": {
        "title": "OAuth authorizations",
        "revokeAll": "Revoke all",
        "total": "{count} authorizations in total",
        "empty": "No OAuth authorizations",
        "revokeAllDialogTitle": "Revoke all authorizations",
        "revokeAllDialogDescription": "This revokes every OAuth authorization for this user and logs them out of all connected third-party apps. Continue?"
      },
      "game": {
        "title": "Game account bindings",
        "add": "Add binding",
        "columns": {
          "server": "Server",
          "gameId": "Game ID"
        },
        "edit": "Edit game binding",
        "unbind": "Unbind game account",
        "empty": "No game bindings",
        "unbindDialogTitle": "Confirm unbind",
        "unbindDialogDescription": "This will unbind game account {gameUserId}. You can re-add it later."
      },
      "social": {
        "title": "Social platform binding",
        "add": "Add binding",
        "empty": "No social platform binding",
        "deleteDialogTitle": "Confirm delete",
        "deleteDialogDescription": "Delete this primary social platform binding? You can add it again later."
      },
      "authSocial": {
        "title": "Authorized social platforms",
        "add": "Add authorization",
        "columns": {
          "platform": "Platform",
          "userId": "User ID",
          "comment": "Comment"
        },
        "empty": "No authorized social platforms",
        "deleteDialogTitle": "Confirm delete",
        "deleteDialogDescription": "Delete this authorized social platform? You can add it again later."
      },
      "ios": {
        "title": "iOS upload code",
        "regenerate": "Regenerate",
        "generate": "Generate upload code",
        "empty": "No upload code",
        "deleteDialogTitle": "Confirm delete",
        "deleteDialogDescription": "Delete the current iOS upload code? You can regenerate a new one afterward."
      },
      "dialog": {
        "email": {
          "title": "Change email",
          "description": "Update email address for user {name}.",
          "newEmail": "New email address",
          "placeholder": "Enter email address",
          "confirm": "Confirm"
        },
        "gameBinding": {
          "title": "Add game binding",
          "description": "Add or update game account binding for user {name}.",
          "server": "Server",
          "gameUserId": "Game user ID",
          "gameUserIdPlaceholder": "Enter in-game user ID",
          "suiteSettings": "Suite settings",
          "mysekaiSettings": "MySekai settings"
        },
        "social": {
          "addTitle": "Add social binding",
          "editTitle": "Edit social binding",
          "description": "Manage primary social binding for user {name}.",
          "platform": "Platform",
          "platformPlaceholder": "Select platform",
          "userId": "User ID",
          "userIdPlaceholder": "User ID on platform"
        },
        "authSocial": {
          "addTitle": "Add authorized social platform",
          "editTitle": "Edit authorized social platform",
          "description": "Manage authorized social accounts for user {name}.",
          "platform": "Platform",
          "platformPlaceholder": "Select platform",
          "userId": "User ID",
          "userIdPlaceholder": "User ID on platform",
          "comment": "Comment",
          "commentPlaceholder": "Comment (optional)"
        }
      },
      "toast": {
        "actionFailedFallback": "Operation failed",
        "loadUserFailedTitle": "Failed to load user detail",
        "loadActivityFailedTitle": "Failed to load activity logs",
        "loadOAuthFailedTitle": "Failed to load OAuth authorizations",
        "loadGameBindingsFailedTitle": "Failed to load game bindings",
        "loadSocialFailedTitle": "Failed to load social binding",
        "loadAuthSocialFailedTitle": "Failed to load authorized social platforms",
        "banFailedTitle": "Ban failed",
        "banSuccess": "User banned",
        "unbanFailedTitle": "Unban failed",
        "unbanSuccess": "User unbanned",
        "forceLogoutFailedTitle": "Force logout failed",
        "forceLogoutSuccess": "Forced logout completed",
        "deleteFailedTitle": "Delete failed",
        "deleteSuccess": "User soft-deleted",
        "restoreFailedTitle": "Restore failed",
        "restoreSuccess": "User restored",
        "resetPasswordFailedTitle": "Password reset failed",
        "resetPasswordSuccess": "Password reset completed",
        "updateRoleFailedTitle": "Role update failed",
        "updateRoleSuccess": "Role updated to {role}",
        "updateEmailFailedTitle": "Email update failed",
        "updateEmailSuccess": "Email updated",
        "revokeOAuthFailedTitle": "Revoke failed",
        "revokeOAuthSuccess": "OAuth authorizations revoked",
        "deleteGameBindingFailedTitle": "Delete failed",
        "deleteGameBindingSuccess": "Game binding removed",
        "toggleCNFailedTitle": "Update failed",
        "cnEnabled": "CN MySekai enabled",
        "cnDisabled": "CN MySekai disabled",
        "saveGameBindingFailedTitle": "Save failed",
        "saveGameBindingSuccess": "Game binding saved",
        "regenerateIOSFailedTitle": "Generate failed",
        "missingIOSCode": "Upload code missing in response",
        "regenerateIOSSuccess": "iOS upload code regenerated",
        "deleteIOSFailedTitle": "Delete failed",
        "deleteIOSSuccess": "iOS upload code deleted",
        "deleteSocialFailedTitle": "Delete failed",
        "deleteSocialSuccess": "Social binding deleted",
        "saveSocialFailedTitle": "Update failed",
        "saveSocialSuccess": "Social platform info updated",
        "deleteAuthSocialFailedTitle": "Delete failed",
        "deleteAuthSocialSuccess": "Authorized social platform deleted",
        "saveAuthSocialFailedTitle": "Save failed",
        "saveAuthSocialSuccess": "Authorized social platform saved"
      }
    }
  }
} as const
