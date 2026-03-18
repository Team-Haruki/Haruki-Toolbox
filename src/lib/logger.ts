type LogLevel = "warn" | "error"

function writeLog(level: LogLevel, scope: string, message: string, ...details: unknown[]) {
  const logger = globalThis.console?.[level]
  if (typeof logger !== "function") {
    return
  }

  logger(`[${scope}] ${message}`, ...details)
}

export function createLogger(scope: string) {
  return {
    warn(message: string, ...details: unknown[]) {
      writeLog("warn", scope, message, ...details)
    },
    error(message: string, ...details: unknown[]) {
      writeLog("error", scope, message, ...details)
    },
  }
}
