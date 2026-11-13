import type { KratosActionRole } from "@/modules/auth/lib/action-hierarchy"

/**
 * Where each visible input of a Kratos form is drawn. The flow UI is a flat
 * list of inputs and buttons; a person reads it as "these fields belong to
 * this button". This module pairs every input with the method button that
 * posts it, so the page can draw one block per method (the primary one first,
 * second-factor alternatives after it) and keep the buttons that need no
 * input (passkey, social providers) in a list of their own.
 *
 * It only arranges what `orderKratosActions` already ordered and classified:
 * the order and the role of every action are taken as given.
 */

export interface FlowFieldLike {
  group: string
}

export interface FlowActionLike {
  group: string
  name: string
  value: string
  role: KratosActionRole
}

export interface FlowMethodBlock<F, A> {
  /** The method's submit button; null for inputs no method button claims. */
  action: A | null
  fields: F[]
}

export interface FlowLayout<F, A> {
  /** The primary method: its inputs over the form's one primary button. */
  primary: FlowMethodBlock<F, A> | null
  /** Other methods with inputs of their own (e.g. a backup code next to TOTP). */
  alternatives: FlowMethodBlock<F, A>[]
  /** Buttons that need no input: passkey first, then social providers. */
  shortcuts: A[]
  /** "Resend code": belongs under the primary method. */
  resend: A[]
  /** "Back" to the previous screen: drawn last. */
  back: A[]
}

const DEFAULT_GROUP = "default"

function normalize(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase()
}

/** The node groups a method button posts besides the default group: its own, and the one named after `method=<value>`. */
function methodGroups(action: FlowActionLike): Set<string> {
  const groups = new Set<string>()
  const group = normalize(action.group)
  if (group && group !== DEFAULT_GROUP) {
    groups.add(group)
  }
  if (normalize(action.name) === "method") {
    const method = normalize(action.value)
    if (method) {
      groups.add(method)
    }
  }
  return groups
}

/**
 * Splits ordered actions by role and hands every field to one method block:
 * the method whose group it shares, otherwise the primary method (which is
 * also where default-group inputs such as the identifier belong). Field and
 * action order are kept. Without any method button the fields form a block
 * of their own with no button.
 */
export function layoutKratosFlow<F extends FlowFieldLike, A extends FlowActionLike>(
  fields: readonly F[],
  orderedActions: readonly A[],
): FlowLayout<F, A> {
  const methods = orderedActions.filter((action) => action.role === "primary" || action.role === "alternative")
  const blocks: FlowMethodBlock<F, A>[] = methods.map((action) => ({ action, fields: [] }))
  const claims = methods.map(methodGroups)
  const unclaimed: F[] = []

  for (const field of fields) {
    const group = normalize(field.group) || DEFAULT_GROUP
    const owner = group === DEFAULT_GROUP ? -1 : claims.findIndex((groups) => groups.has(group))
    const block = blocks[owner >= 0 ? owner : 0]
    if (block) {
      block.fields.push(field)
    } else {
      unclaimed.push(field)
    }
  }

  const [first, ...rest] = blocks
  let primary: FlowMethodBlock<F, A> | null = first ?? null
  if (!primary && unclaimed.length > 0) {
    primary = { action: null, fields: unclaimed }
  }

  return {
    primary,
    alternatives: rest,
    shortcuts: orderedActions.filter((action) => action.role === "passkey" || action.role === "social"),
    resend: orderedActions.filter((action) => action.role === "resend"),
    back: orderedActions.filter((action) => action.role === "back"),
  }
}
