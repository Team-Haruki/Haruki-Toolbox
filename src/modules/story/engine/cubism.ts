// The Live2D Cubism core is a plain script that defines window.Live2DCubismCore;
// the Live2D display library needs it before its first model. It is served with
// the player's other files (Live2D "Redistributable Code").

import { storyUrls } from "./urls";

let loading: Promise<void> | undefined;

export function loadCubismCore(): Promise<void> {
  if ((window as unknown as { Live2DCubismCore?: unknown }).Live2DCubismCore) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = storyUrls.lib("live2dcubismcore.min.js");
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = undefined;
      script.remove();
      reject(new Error("Live2D Cubism core failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}
