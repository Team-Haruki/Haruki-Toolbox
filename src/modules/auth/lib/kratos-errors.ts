/** A Kratos self-service endpoint answered with a non-2xx status. */
export class KratosRequestError extends Error {
  readonly operation: string
  readonly status: number

  constructor(operation: string, status: number) {
    super(`kratos ${operation} request failed: ${status}`)
    this.name = "KratosRequestError"
    this.operation = operation
    this.status = status
  }
}
