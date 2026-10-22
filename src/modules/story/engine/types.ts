// ScenarioSceneData — mirrors the il2cpp dump (Sekai.ScenarioSceneData et al.).
// Only the fields the interpreter currently uses are typed precisely.

export interface AppearCharacter {
  Character2dId: number;
  CostumeType: string;
}

export interface ScenarioCharacterLayout {
  PositionSide: number;
  Character2dId: number;
  CostumeType: string;
  MotionName: string;
  FacialName: string;
  OffsetX: number;
}

// ScenarioSnippet.ActionType
export const Action = {
  None: 0,
  Talk: 1,
  CharacterLayout: 2,
  InputName: 3,
  CharacterMotion: 4,
  Selectable: 5,
  SpecialEffect: 6,
  Sound: 7,
  CharacterLayoutMode: 8,} as const;
export type Action = (typeof Action)[keyof typeof Action];

// ScenarioSnippet.ProgressType
export const Progress = {
  Now: 0,
  WaitFinished: 1,} as const;
export type Progress = (typeof Progress)[keyof typeof Progress];

export interface Snippet {
  Index: number;
  Action: Action;
  ProgressBehavior: Progress;
  ReferenceIndex: number;
  Delay: number;
}

export interface TalkMotion {
  Character2dId: number;
  MotionName: string;
  FacialName: string;
  TimingSyncValue: number;
}
export interface TalkVoice {
  Character2dId: number;
  VoiceId: string;
  Volume: number;
}
export interface SnippetTalk {
  TalkCharacters: { Character2dId: number }[];
  WindowDisplayName: string;
  Body: string;
  LipSync: number; // 0=Text, 1=Voice, 2=Close
  MotionChangeFrom: number; // 0=Text, 1=PlayTime (timed motions sync to talk time)
  Motions: TalkMotion[];
  Voices: TalkVoice[];
  Speed: number;
  FontSize: number;
  WhenFinishCloseWindow: boolean | number;
  TargetValueScale: number; // lip-sync open scale (0 = use default)
}

// ScenarioSnippetCharacterLayout.ActionType
export const LayoutType = {
  None: 0,
  Move: 1,
  Apper: 2, // (sic — matches the game's enum spelling)
  Hide: 3,
  ShakeX: 4,
  ShakeY: 5,
  Layer: 6,} as const;
export type LayoutType = (typeof LayoutType)[keyof typeof LayoutType];

export interface SnippetCharacterLayout {
  Type: LayoutType;
  SideFrom: number;
  SideFromOffsetX: number;
  SideTo: number;
  SideToOffsetX: number;
  DepthType: number;
  Character2dId: number;
  CostumeType: string;
  MotionName: string;
  FacialName: string;
  MoveSpeedType: number;
}

// ScenarioSnippetSound.SoundPlayMode
export const SoundPlayMode = {
  CrossFade: 0,
  Stack: 1,
  SpecialSePlay: 2,
  Stop: 3,
  BgmVolume: 4,
  BgmAisacVolume: 5,
  BgmAisacIndex: 6,} as const;
export type SoundPlayMode = (typeof SoundPlayMode)[keyof typeof SoundPlayMode];

export interface SnippetSound {
  PlayMode: SoundPlayMode;
  Bgm: string;
  Se: string;
  Volume: number;
  SeBundleName: string;
  Duration: number;
  BgmBlockIndex: number;
}

// ScenarioSnippetSpecialEffect.SpecialEffectType (subset we model)
export const SpecialEffectType = {
  None: 0,
  BlackIn: 1,
  BlackOut: 2,
  WhiteIn: 3,
  WhiteOut: 4,
  ShakeScreen: 5,
  ShakeWindow: 6,
  ChangeBackground: 7,
  Telop: 8,
  FlashbackIn: 9,
  FlashbackOut: 10,
  ChangeCardStill: 11,
  AmbientColorNormal: 12,
  AmbientColorEvening: 13,
  AmbientColorNight: 14,
  PlayScenarioEffect: 15,
  StopScenarioEffect: 16,
  ChangeBackgroundStill: 17,
  PlaceInfo: 18,
  Movie: 19,
  SekaiIn: 20,
  SekaiOut: 21,
  AttachCharacterShader: 22,
  SimpleSelectable: 23,
  FullScreenText: 24,
  StopShakeScreen: 25,
  StopShakeWindow: 26,
  SepiaIn: 27,
  SepiaOut: 28,
  LeftIn: 29,
  LeftOut: 30,
  RightIn: 31,
  RightOut: 32,
  TopIn: 33,
  TopOut: 34,
  BottomIn: 35,
  BottomOut: 36,
  MusicVideo: 37,
  BlurIn: 38,
  BlurOut: 39,
  SekaiIn3anv: 40,
  SekaiOut3anv: 41,
  CameraMove: 42,
  CameraZoom: 43,
  BackGroundBlur: 44,
  DollyZoom: 45,} as const;
export type SpecialEffectType = (typeof SpecialEffectType)[keyof typeof SpecialEffectType];

export interface SnippetSpecialEffect {
  EffectType: SpecialEffectType;
  StringVal: string;
  StringValSub: string;
  Duration: number;
  IntVal: number;
}

export interface ScenarioSceneData {
  ScenarioId: string;
  AppearCharacters: AppearCharacter[];
  FirstLayout: ScenarioCharacterLayout[];
  FirstBgm: string;
  FirstBackground: string;
  FirstCharacterLayoutMode: number;
  Snippets: Snippet[];
  TalkData: SnippetTalk[];
  LayoutData: SnippetCharacterLayout[];
  SoundData: SnippetSound[];
  SpecialEffectData: SnippetSpecialEffect[];
  ScenarioSnippetCharacterLayoutModes: SnippetCharacterLayoutMode[];
}

// Character positions — RectTransform anchored X on the game's 1920-ref canvas
// (x=0 = center), from ScenarioCharacterLayoutMap.Initialize. DefaultMode is the
// 2-character layout (±360); ThreeMode spreads the outer slots to ±576. "Over"
// slots are off-screen. Inside == outer (per the binary).
// Over slots (2/6) are off-screen at ±(1920/2 + 819.2) = ±1779 (same both modes).
const SIDE_GAMEX_DEFAULT: Record<number, number> = {
  0: 0, 1: -360, 2: -1779, 3: -360, 4: 0, 5: 360, 6: 1779, 7: 360,
  8: -360, 9: -360, 10: 0, 11: 360, 12: 360,
};
const SIDE_GAMEX_THREE: Record<number, number> = {
  0: 0, 1: -576, 2: -1779, 3: -576, 4: 0, 5: 576, 6: 1779, 7: 576,
  8: -576, 9: -576, 10: 0, 11: 576, 12: 576,
};
const CANVAS_REF_W = 1920;

// CharacterLayoutMode: 0 = DefaultMode (2-char), 3 = ThreeMode (3-char).
export function sideToFraction(side: number, mode: number): number {
  const t = mode === 3 ? SIDE_GAMEX_THREE : SIDE_GAMEX_DEFAULT;
  return 0.5 + (t[side] ?? 0) / CANVAS_REF_W;
}
// Per-mode model scale (defaultModeScale=1.0, threeModescale=0.9).
export function modeScale(mode: number): number {
  return mode === 3 ? 0.9 : 1.0;
}

// ScenarioSnippetCharacterLayoutMode (action 8 data, in ScenarioSnippetCharacterLayoutModes[])
export interface SnippetCharacterLayoutMode {
  CharacterLayoutMode: number; // 0 = DefaultMode, 3 = ThreeMode
}

/** Member name of a value of one of the const enums above (for logs). */
export function enumName(e: Record<string, number>, value: number): string | undefined {
  return Object.keys(e).find((k) => e[k] === value);
}
