/**
 * Which cross-origin images the Service Worker caches CacheFirst in
 * `sekai-image-assets-v2` (`src/sw.ts`). Shared with the worker build, so this
 * file must stay free of DOM- or worker-only APIs.
 *
 * Cached: game-asset and toolbox CDN images (jackets, card art, icons, story
 * thumbnails), which are content-addressed and immutable. Latency probes stay
 * on the network (caching them would make endpoint re-tests measure cache
 * reads).
 *
 * Not cached: the story player's files. A scenario loads a dozen Live2D
 * textures of about 2 MB each plus its backgrounds in one burst; routed through
 * the worker, some of those responses stalled after their headers and the
 * episode never left its loading screen, while it played normally with the
 * worker bypassed. They are fetched once per episode and the HTTP cache keeps
 * them, so the worker gains nothing there.
 */
const SEKAI_IMAGE =
  /^https:\/\/(sekai-assets-haruki\.seiunx\.net|sekai-assets-cn03-she01-cdn\.haruki\.seiunx\.com|images\.haruki\.seiunx\.com)\/(?!asset-probe\.png(?:\?|$)).*\.(?:png|jpe?g|webp|avif)(?:\?.*)?$/i

/** Live2D models and scenario backgrounds of any region tree, and the story player's own files. */
const STORY_PLAYER_ASSET = /^https:\/\/[^/]+\/[a-z]+-assets\/(?:(?:startapp|ondemand)\/(?:live2d|scenario)\/|story-player\/)/i

export function isCachedSekaiImage(url: string): boolean {
  return SEKAI_IMAGE.test(url) && !STORY_PLAYER_ASSET.test(url)
}

/**
 * Whether a cached image may answer this request.
 *
 * `<img>` loads are no-cors, so what they put in the cache is opaque: fine
 * for another `<img>`, but a script that reads the picture (the image
 * viewer's `fetch`, an `<img crossorigin>`) asks in cors mode, and a browser
 * rejects an opaque response to a cors request. Served from the cache, the
 * viewer's fetch failed whenever a thumbnail had been shown first, which is
 * nearly always. Such a request has to go to the network instead; its
 * readable response then replaces the opaque entry, and serves both kinds of
 * request from then on.
 */
export function canServeCachedImage(requestMode: string, cachedResponseType: string): boolean {
  return requestMode === "no-cors" || cachedResponseType !== "opaque"
}
