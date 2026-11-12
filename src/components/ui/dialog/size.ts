/** Dialog widths from the `sm` breakpoint up. One scale for every dialog, so two dialogs on a page line up. */
export const DIALOG_SIZE_CLASS = {
  /** 28rem: a code to type, one or two fields. */
  sm: "sm:max-w-[28rem]",
  /** 35rem: a form. The default. */
  md: "sm:max-w-[35rem]",
  /** 45rem: a record's details, a wide form. */
  lg: "sm:max-w-[45rem]",
  /** 60rem: a picker, a chart. */
  xl: "sm:max-w-[60rem]",
  /** 72rem: a table. */
  "2xl": "sm:max-w-[72rem]",
} as const

export type DialogSize = keyof typeof DIALOG_SIZE_CLASS
