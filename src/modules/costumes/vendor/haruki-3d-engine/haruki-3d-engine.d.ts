/**
 * Hand-written declarations for the vendored Haruki 3D Engine browser build
 * (Team-Haruki/Haruki-3D-Engine). Mirrors docs/api.md of the upstream repo.
 */

export type PreviewLightState = Record<string, unknown>

export type Haruki3DKernelOptions = {
  canvas: HTMLCanvasElement
  /** Final Exporter runtime root for exactly one region. */
  assetBaseUrl: string
  initialLight?: PreviewLightState
  /** Basis transcoder directory; defaults to `/basis/`. */
  ktx2TranscoderPath?: string
}

export type HarukiRenderRecipe = {
  /** `<characterId>:<unit>`, e.g. `14:theme_park`. */
  roleId: string
  bodyCostume3dId: number
  headCostume3dId: number
  headPackagePath?: string | null
  hairCostume3dId: number
  headOptionalCostume3dId?: number | null
}

export interface Haruki3DKernel {
  prepare(recipe: HarukiRenderRecipe): Promise<void>
  load(recipe: HarukiRenderRecipe): Promise<void>
  play(): void
  pause(): void
  resize(width: number, height: number): void
  /** Teleports the loaded character around its vertical axis. */
  setCharacterYawDegrees(degrees: number): void
  /** Rotates the CostumeShop CameraRoot without moving the character skeleton. */
  setViewYawDegrees(degrees: number): void
  /** Dollies the camera: 1 keeps the profile distance, 2 is twice as close. Clamped to 0.5..3. */
  setViewZoom(zoom: number): void
  /** Slides target and camera up or down by the given metres. Clamped to -0.5..0.8. */
  setViewHeightOffset(metres: number): void
  destroy(): Promise<void>
}

export declare function createHaruki3DKernel(options: Haruki3DKernelOptions): Haruki3DKernel

export declare const previewLightDefaults: PreviewLightState
