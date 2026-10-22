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
  /^https:\/\/(sekai-assets\.haruki\.seiunx\.com|sekai-assets-haruki\.seiunx\.net|sekai-assets-cn03-she01-cdn\.haruki\.seiunx\.com|images\.haruki\.seiunx\.com)\/(?!asset-probe\.png(?:\?|$)).*\.(?:png|jpe?g|webp|avif)(?:\?.*)?$/i

/** Live2D models and scenario backgrounds of any region tree, and the story player's own files. */
const STORY_PLAYER_ASSET = /^https:\/\/[^/]+\/[a-z]+-assets\/(?:(?:startapp|ondemand)\/(?:live2d|scenario)\/|story-player\/)/i

export function isCachedSekaiImage(url: string): boolean {
  return SEKAI_IMAGE.test(url) && !STORY_PLAYER_ASSET.test(url)
}
