/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HARUKI_TOOLBOX_USER_BASE_URL: string
  readonly VITE_TURNSTILE_SITE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

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
