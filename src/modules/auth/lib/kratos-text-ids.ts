/**
 * Every Kratos UI text id the Toolbox translates, keyed under
 * `auth.kratos.text.<id>` in the core bundle.
 *
 * Source of truth: `text/id.go` of ory/kratos v25.4.0 (the version our
 * deployment runs), minus the "root" constants that never reach a flow
 * (1010000, 1020000, 1030000, 1040000, 1050000, 1060000, 1070000, 1080000,
 * 4000000, 4010000, 4040000, 4050000, 4060000, 4070000, 5000000).
 * Ids listed only in the newer Ory message catalog
 * (https://www.ory.com/docs/kratos/concepts/ui-messages) are kept in
 * KRATOS_TEXT_IDS_NEWER so an upgrade does not regress to English.
 *
 * The coverage test checks that every id below has text in all locales.
 */
export const KRATOS_TEXT_IDS_V25_4: readonly number[] = [
  // Login (1010xxx)
  1010001, 1010002, 1010003, 1010004, 1010005, 1010006, 1010007, 1010008, 1010009, 1010010,
  1010011, 1010012, 1010013, 1010014, 1010015, 1010016, 1010017, 1010018, 1010019, 1010020,
  1010021, 1010022, 1010023,
  // Registration (1040xxx)
  1040001, 1040002, 1040003, 1040004, 1040005, 1040006, 1040007, 1040008, 1040009,
  // Settings (1050xxx)
  1050001, 1050002, 1050003, 1050004, 1050005, 1050006, 1050007, 1050008, 1050009, 1050010,
  1050011, 1050012, 1050013, 1050014, 1050015, 1050016, 1050017, 1050018, 1050019, 1050020,
  // Recovery (1060xxx)
  1060001, 1060002, 1060003, 1060004, 1060005, 1060006, 1060007,
  // Node labels (1070xxx)
  1070001, 1070002, 1070003, 1070004, 1070005, 1070006, 1070007, 1070008, 1070009, 1070010,
  1070011, 1070012, 1070013, 1070014, 1070015, 1070016, 1070017,
  // Verification (1080xxx)
  1080001, 1080002, 1080003,
  // Validation (4000xxx)
  4000001, 4000002, 4000003, 4000004, 4000005, 4000006, 4000007, 4000008, 4000009, 4000010,
  4000011, 4000012, 4000013, 4000014, 4000015, 4000016, 4000017, 4000018, 4000019, 4000020,
  4000021, 4000022, 4000023, 4000024, 4000025, 4000026, 4000027, 4000028, 4000029, 4000030,
  4000031, 4000032, 4000033, 4000034, 4000035, 4000036, 4000037, 4000038, 4000039,
  // Login / flow errors (4010xxx)
  4010001, 4010002, 4010003, 4010004, 4010005, 4010006, 4010007, 4010008, 4010009, 4010010,
  // Registration errors (4040xxx)
  4040001, 4040002, 4040003,
  // Settings errors (4050xxx)
  4050001,
  // Recovery errors (4060xxx)
  4060001, 4060002, 4060003, 4060004, 4060005, 4060006,
  // Verification errors (4070xxx)
  4070001, 4070002, 4070003, 4070004, 4070005, 4070006,
  // System (5000xxx)
  5000001,
]

/** Ids from the current Ory catalog that v25.4.0 does not emit yet. */
export const KRATOS_TEXT_IDS_NEWER: readonly number[] = [
  1010024, 1010025, 1010026,
  1050023, 1050024,
  1070018,
  1080004, 1080005,
  4000040, 4000041, 4000042, 4000043, 4000044, 4000045, 4000046, 4000047,
  4010011,
  4050002,
  5000002, 5000003,
]

export const KRATOS_TEXT_IDS: readonly number[] = [...KRATOS_TEXT_IDS_V25_4, ...KRATOS_TEXT_IDS_NEWER]

/** Error ids (`error.id`) a self-service error or the error page can carry (text/message_error.go and herodot). */
export const KRATOS_ERROR_IDS: readonly string[] = [
  "security_csrf_violation",
  "security_identity_mismatch",
  "session_already_available",
  "session_aal_already_fulfilled",
  "session_aal1_required",
  "session_aal2_required",
  "session_inactive",
  "session_refresh_required",
  "session_verified_address_required",
  "self_service_flow_expired",
  "self_service_flow_disabled",
  "self_service_flow_replaced",
  "self_service_flow_return_to_forbidden",
  "browser_location_change_required",
  "invalid_configuration",
]
