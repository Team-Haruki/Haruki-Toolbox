/**
 * Hand-written declarations for the vendored Haruki 3D CostumeShop entry
 * (`haruki-3d-engine/costume_shop` of the Haruki-3D engine). Mirrors its docs/api.md: the kernel, the content it
 * reads (AssetBundleInfo, original bundles, master rows), createMirrorContent and listRoleParts.
 */

export type HarukiOriginalAssetBundleElement = {
  bundleName: string
  cacheFileName: string
  cacheDirectoryName: string
  hash: string
  category: string
  crc: number
  fileSize: number
  dependencies: string[]
  paths: string[]
  isBuiltin: boolean
  isRelocate: boolean
}

/** Bytes, or a URL the kernel fetches. */
export type HarukiOriginalBytesSource = ArrayBuffer | ArrayBufferView | Blob | Response | string | URL

/** Original master rows of one character's load (whole tables are accepted too). */
export type HarukiCostumeMasterData = {
  version?: string
  gameCharacters: unknown[]
  gameCharacterUnits: unknown[]
  gameCharacterUnit3dMotions: unknown[]
  character3ds: unknown[]
  costume3ds: unknown[]
  costume3dModels: unknown[]
  costume3dModelNotAvailablePatterns: unknown[]
  costume3dModelDefaultHairs: unknown[]
}

export type HarukiCostumeShopContent = {
  /** The version's AssetBundleInfo (decrypted MessagePack, or ROW JSON). */
  assetBundleInfo: HarukiOriginalBytesSource
  /** One original bundle: decrypted UnityFS or the CDN's encrypted bytes, or a URL serving either. */
  provideBundle(
    bundle: HarukiOriginalAssetBundleElement,
    context: { version: string; signal: AbortSignal },
  ): HarukiOriginalBytesSource | Promise<HarukiOriginalBytesSource>
  provideMasterData(characterId: number): HarukiCostumeMasterData | Promise<HarukiCostumeMasterData>
  /** Where `ui/archive-background/*` is served, for the "archive" background only. */
  archiveBackgroundBaseUrl?: string
}

export type MirrorContentOptions = {
  masterBaseUrl?: string
  /** "characters": `master/characters/<id>.json`, one character's rows per request (the Toolbox backend). */
  masterLayout?: "tables" | "characters"
  archiveBackgroundBaseUrl?: string
}

/** A content read from a raw-bundle mirror tree (`current.json`, `catalogs/`, `bundles/`, `master/`). */
export declare function createMirrorContent(baseUrl: string, options?: MirrorContentOptions): Promise<HarukiCostumeShopContent>

export type HarukiRolePart = {
  costume3dId: number
  characterId: number
  /** "body", "head", "hair" or "head_optional". */
  partType: string
  unit: string | null
  status: "ready" | "empty" | "missing"
  packagePath: string
  headCostume3dAssetbundleType: string | null
  name: string | null
  colorId: number | null
  colorName: string | null
  costume3dGroupId: number | null
  thumbnailAssetbundleName: string | null
}

export type HarukiRoleParts = {
  /** The role's character3ds preset. */
  role: {
    roleId: number
    characterId: number
    unit: string | null
    bodyCostume3dId: number
    headCostume3dId: number
    hairCostume3dId: number
    characterHeightMeters: number
  }
  /** The character's units (gameCharacterUnits order), each a role `<characterId>:<unit>`; a Virtual Singer has six. */
  units: string[]
  /** The character's own costumes (another character's costume a preset reuses is not listed). */
  parts: HarukiRolePart[]
  /** Head / hair pairs of the role's unit that cannot be worn together (costume3dModelNotAvailablePatterns). */
  notAvailablePatterns: { headCostume3dId: number; hairCostume3dId: number }[]
  /** The hair each head of the role's unit brings (costume3dModelDefaultHairs). */
  defaultHairs: { headCostume3dId: number; hairCostume3dId: number }[]
  /** Every motion the content has, for any role: a recipe's motionRoleId / motionType. */
  motions: HarukiMotionEntry[]
}

export type HarukiMotionEntry = {
  motionType: "costume" | "result" | "preview"
  /** `<characterId>:<unit>`; for a preview loop, the first unit of that figure. */
  motionRoleId: string
  /** The unit's character and unit; null for a preview loop. */
  characterId: number | null
  unit: string | null
  figure: "ladies" | "mens" | null
}

/** The role's preset and parts, without loading a bundle (shares the kernel's worker for the same content). */
export declare function listRoleParts(content: HarukiCostumeShopContent, roleId: string): Promise<HarukiRoleParts>

export type Haruki3DKernelOptions = {
  canvas: HTMLCanvasElement
  content: HarukiCostumeShopContent
  background?: "transparent" | "archive"
}

export type HarukiRenderRecipe = {
  /** `<characterId>:<unit>`, e.g. `14:theme_park`. */
  roleId: string
  bodyCostume3dId: number
  headCostume3dId: number
  headPackagePath?: string | null
  hairCostume3dId: number
  headOptionalCostume3dId?: number | null
  motionRoleId?: string | null
  motionType?: "costume" | "result" | "preview" | null
}

/**
 * A head accessory alone: only its bundle is read (no body, face, hair or motion), shown in its authored pose,
 * centred and framed on its own (view yaw, zoom and height offset apply). A following character recipe loads the
 * character again.
 */
export type HarukiHeadOptionalRecipe = {
  kind: "head_optional"
  roleId: string
  /** Its head_optional costume3dId in that role's registry. */
  headOptionalCostume3dId: number
}

export interface Haruki3DKernel {
  prepare(recipe: HarukiRenderRecipe | HarukiHeadOptionalRecipe): Promise<void>
  load(recipe: HarukiRenderRecipe | HarukiHeadOptionalRecipe): Promise<void>
  play(): void
  pause(): void
  resize(width: number, height: number): void
  /** Rotates the CostumeShop CameraRoot without moving the character skeleton. */
  setViewYawDegrees(degrees: number): void
  /** Dollies the camera: 1 keeps the pose's distance, 2 is twice as close. Clamped to 0.5..3. */
  setViewZoom(zoom: number): void
  /** Slides target and camera up or down by the given metres. Clamped to -0.5..0.8. */
  setViewHeightOffset(metres: number): void
  setBackground(background: "transparent" | "archive"): Promise<void>
  /**
   * "all": the whole character; "head_optional": only the worn head accessory, taken off the character and framed on
   * its own (kept across load()). Redraws when paused.
   */
  setPartDisplay(display: "all" | "head_optional"): void
  destroy(): Promise<void>
}

export declare function createHaruki3DKernel(options: Haruki3DKernelOptions): Haruki3DKernel
