import { purgeCachedSekaiImage } from "@/shared/sekai/image-recovery"
import {
  IMAGE_RETRY_BACKOFF_LIMIT,
  IMAGE_RETRY_COUNT_ATTRIBUTE,
  IMAGE_RETRY_DELAY_MS,
  IMAGE_RETRY_LIMIT,
  IMAGE_RETRY_MAX_DELAY_MS,
  IMAGE_RETRY_ORIGINAL_ATTRIBUTE,
  IMAGE_RETRY_PARAM,
} from "./rank-border-constants"
import type { RecoverableImageTarget } from "./rank-border-types"

/**
 * Self-healing image handlers shared by the leader-card `<img>` layers and the
 * honor `<svg><image>` layers. On error the element is hidden, the cached
 * (possibly poisoned) Service-Worker entry is purged, and the original URL is
 * retried with exponential backoff and a cache-busting param; on load the
 * element is restored. State lives on the element's dataset because Vue reuses
 * DOM nodes across row re-renders.
 */
export function hideBrokenImage(event: Event) {
  if (event.target instanceof HTMLImageElement || event.target instanceof SVGImageElement) {
    retryRecoverableImage(event.target)
  }
}

export function resetRecoveredImage(event: Event) {
  if (event.target instanceof HTMLImageElement || event.target instanceof SVGImageElement) {
    showRecoverableImage(event.target)
    event.target.removeAttribute(IMAGE_RETRY_COUNT_ATTRIBUTE)
    event.target.removeAttribute(IMAGE_RETRY_ORIGINAL_ATTRIBUTE)
  }
}

function retryRecoverableImage(target: RecoverableImageTarget) {
  const currentSource = recoverableImageSource(target)
  if (!currentSource) {
    hideRecoverableImage(target)
    return
  }

  const strippedSource = stripImageRetryParam(currentSource)
  const storedSource = target.getAttribute(IMAGE_RETRY_ORIGINAL_ATTRIBUTE)
  const storedSourceMatches = storedSource != null && stripImageRetryParam(storedSource) === strippedSource
  const originalSource = storedSourceMatches
    ? storedSource
    : strippedSource
  target.setAttribute(IMAGE_RETRY_ORIGINAL_ATTRIBUTE, originalSource)
  hideRecoverableImage(target)
  const retryCount = storedSourceMatches
    ? Number(target.getAttribute(IMAGE_RETRY_COUNT_ATTRIBUTE) ?? "0")
    : 0
  if (retryCount >= IMAGE_RETRY_LIMIT) {
    return
  }

  void purgeCachedSekaiImage(originalSource)
  const nextRetryCount = retryCount + 1
  target.setAttribute(IMAGE_RETRY_COUNT_ATTRIBUTE, String(nextRetryCount))
  window.setTimeout(() => {
    if (!target.isConnected || target.getAttribute(IMAGE_RETRY_ORIGINAL_ATTRIBUTE) !== originalSource) {
      return
    }

    setRecoverableImageSource(target, appendImageRetryParam(originalSource, nextRetryCount))
  }, recoverableImageRetryDelay(nextRetryCount))
}

function recoverableImageRetryDelay(retryCount: number) {
  const backoffStep = Math.min(retryCount - 1, IMAGE_RETRY_BACKOFF_LIMIT)
  return Math.min(IMAGE_RETRY_DELAY_MS * 2 ** backoffStep, IMAGE_RETRY_MAX_DELAY_MS)
}

function recoverableImageSource(target: RecoverableImageTarget) {
  if (target instanceof HTMLImageElement) {
    return target.getAttribute("src") || target.currentSrc || target.src
  }

  return target.getAttribute("href")
    || target.getAttributeNS("http://www.w3.org/1999/xlink", "href")
}

function setRecoverableImageSource(target: RecoverableImageTarget, source: string) {
  if (target instanceof HTMLImageElement) {
    target.src = source
    return
  }

  target.setAttribute("href", source)
  target.setAttributeNS("http://www.w3.org/1999/xlink", "href", source)
}

function hideRecoverableImage(target: RecoverableImageTarget) {
  target.style.visibility = "hidden"
  if (target instanceof SVGImageElement) {
    target.setAttribute("visibility", "hidden")
  }
}

function showRecoverableImage(target: RecoverableImageTarget) {
  target.style.visibility = ""
  if (target instanceof SVGImageElement) {
    target.removeAttribute("visibility")
  }
}

export function appendImageRetryParam(source: string, retryCount: number) {
  const [baseSource, hash = ""] = source.split("#", 2)
  const separator = baseSource.includes("?") ? "&" : "?"
  const nextSource = `${stripImageRetryParam(baseSource)}${separator}${IMAGE_RETRY_PARAM}=${retryCount}-${Date.now()}`
  return hash ? `${nextSource}#${hash}` : nextSource
}

export function stripImageRetryParam(source: string) {
  try {
    const url = new URL(source, window.location.href)
    url.searchParams.delete(IMAGE_RETRY_PARAM)
    if (source.startsWith("http://") || source.startsWith("https://") || source.startsWith("//")) {
      return url.toString()
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return source.replace(new RegExp(`([?&])${IMAGE_RETRY_PARAM}=[^&#]*&?`), "$1").replace(/[?&]$/, "")
  }
}
