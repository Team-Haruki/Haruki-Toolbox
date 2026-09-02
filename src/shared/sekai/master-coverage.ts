import { normalizeSekaiMasterFileName } from "./data-sources"
import { SEKAI_DATA_OPTIONAL_MASTER_FILES } from "./worker-protocol"

const OPTIONAL_MASTER_FILE_SET = new Set<string>(SEKAI_DATA_OPTIONAL_MASTER_FILES)

/**
 * The requested files a region cache must actually hold: everything except
 * the tables some dumps legitimately never ship (`resourceBoxDetails` on
 * jp/en, `resourceBoxes` on cn, ...).
 *
 * Callers used to demand the optional files too. When one of those is
 * absent from the cache — the CDN answers 404 without CORS headers, so the
 * browser reports a network error and the worker cannot record the file as
 * missing — the region never counted as covered, and every ensure fetched
 * the same file again.
 */
export function requiredMasterFiles(
  requestedFiles: readonly string[],
  extraOptionalFiles: readonly string[] = [],
): string[] {
  const extraOptional = new Set(extraOptionalFiles.map(normalizeSekaiMasterFileName))
  return requestedFiles
    .map(normalizeSekaiMasterFileName)
    .filter((fileName) => !OPTIONAL_MASTER_FILE_SET.has(fileName) && !extraOptional.has(fileName))
}

/** True when every required (non-optional) requested file is in the cache listing. */
export function isMasterCacheCovering(
  cachedFiles: readonly string[],
  requestedFiles: readonly string[],
  extraOptionalFiles: readonly string[] = [],
): boolean {
  const cached = new Set(cachedFiles.map(normalizeSekaiMasterFileName))
  return requiredMasterFiles(requestedFiles, extraOptionalFiles).every((fileName) => cached.has(fileName))
}
