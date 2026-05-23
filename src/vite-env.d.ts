/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly ENABLE_CLOUDFLARE_TURNSTILE?: string
  readonly VITE_HARUKI_TOOLBOX_DIRECT_URL: string
  readonly VITE_HARUKI_TOOLBOX_CDN_URL: string
  readonly VITE_HARUKI_TOOLBOX_AUTH_URL?: string
  readonly VITE_ENABLE_CLOUDFLARE_TURNSTILE?: string
  readonly VITE_HARUKI_TOOLBOX_WEB_URL?: string
  readonly VITE_TURNSTILE_SITE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_VERSION__: string
declare const __APP_GIT_HASH__: string
declare const __APP_BUILD_TIME__: string

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: string;
  size?: string;
  action?: string;
}

interface TurnstileObject {
  render: (container: HTMLElement | string, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  execute: (widgetId: string) => void;
  remove: (widgetId: string) => void;
  getResponse: (widgetId: string) => string | undefined;
}

interface Window {
  turnstile?: TurnstileObject;
}
