/* tslint:disable */
/* eslint-disable */

export class Drawing {
    free(): void;
    [Symbol.dispose](): void;
    clearMusicMeta(): void;
    constructor();
    setGenerator(generator: string): void;
    setMusicMetaJson(music_meta_json: string): void;
    setNoteAssetExtension(extension: string): void;
    setNoteHost(note_host: string): void;
    setSkill(skill: boolean): void;
    setStyleSheet(style_sheet?: string | null): void;
    svg(score: Score): string;
    svgWithLyric(score: Score, lyric: Lyric): string;
    laneWidth: number;
    noteSize: number;
    timeHeight: number;
}

export class Lyric {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    static fromText(content: string): Lyric;
    readonly wordCount: number;
}

export class Rebase {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    apply(score: Score): Score;
    static fromJson(json_str: string): Rebase;
}

export class Score {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    copy(): Score;
    eventsJson(): string;
    static fromJson(content: string): Score;
    static fromSus(content: string): Score;
    getBarByTime(time: number): number;
    getBarByTimeText(time: number): string;
    getTime(bar: number): number;
    getTimeDelta(bar_from: number, bar_to: number): number;
    getTimeText(bar: number): string;
    static load(content: string): Score;
    metaJson(): string;
    setMetaField(name: string, value: string): boolean;
    setMetaJson(meta_json: string): void;
    svg(): string;
    readonly artist: string | undefined;
    readonly difficulty: string | undefined;
    readonly eventCount: number;
    readonly noteCount: number;
    readonly playlevel: string | undefined;
    readonly title: string | undefined;
}

export function jsonToSvg(content: string): string;

export function scoreToSvg(content: string): string;

export function susToSvg(content: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_drawing_free: (a: number, b: number) => void;
    readonly __wbg_lyric_free: (a: number, b: number) => void;
    readonly __wbg_rebase_free: (a: number, b: number) => void;
    readonly __wbg_score_free: (a: number, b: number) => void;
    readonly drawing_clearMusicMeta: (a: number) => void;
    readonly drawing_laneWidth: (a: number) => number;
    readonly drawing_new: () => number;
    readonly drawing_noteSize: (a: number) => number;
    readonly drawing_setGenerator: (a: number, b: number, c: number) => void;
    readonly drawing_setMusicMetaJson: (a: number, b: number, c: number, d: number) => void;
    readonly drawing_setNoteAssetExtension: (a: number, b: number, c: number) => void;
    readonly drawing_setNoteHost: (a: number, b: number, c: number) => void;
    readonly drawing_setSkill: (a: number, b: number) => void;
    readonly drawing_setStyleSheet: (a: number, b: number, c: number) => void;
    readonly drawing_set_laneWidth: (a: number, b: number) => void;
    readonly drawing_set_noteSize: (a: number, b: number) => void;
    readonly drawing_set_timeHeight: (a: number, b: number) => void;
    readonly drawing_svg: (a: number, b: number, c: number) => void;
    readonly drawing_svgWithLyric: (a: number, b: number, c: number, d: number) => void;
    readonly drawing_timeHeight: (a: number) => number;
    readonly jsonToSvg: (a: number, b: number, c: number) => void;
    readonly lyric_fromText: (a: number, b: number) => number;
    readonly lyric_wordCount: (a: number) => number;
    readonly rebase_apply: (a: number, b: number) => number;
    readonly rebase_fromJson: (a: number, b: number, c: number) => void;
    readonly scoreToSvg: (a: number, b: number, c: number) => void;
    readonly score_artist: (a: number, b: number) => void;
    readonly score_copy: (a: number) => number;
    readonly score_difficulty: (a: number, b: number) => void;
    readonly score_eventCount: (a: number) => number;
    readonly score_eventsJson: (a: number, b: number) => void;
    readonly score_fromJson: (a: number, b: number, c: number) => void;
    readonly score_fromSus: (a: number, b: number) => number;
    readonly score_getBarByTime: (a: number, b: number, c: number) => void;
    readonly score_getBarByTimeText: (a: number, b: number, c: number) => void;
    readonly score_getTime: (a: number, b: number, c: number) => void;
    readonly score_getTimeDelta: (a: number, b: number, c: number, d: number) => void;
    readonly score_getTimeText: (a: number, b: number, c: number) => void;
    readonly score_load: (a: number, b: number, c: number) => void;
    readonly score_metaJson: (a: number, b: number) => void;
    readonly score_noteCount: (a: number) => number;
    readonly score_playlevel: (a: number, b: number) => void;
    readonly score_setMetaField: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly score_setMetaJson: (a: number, b: number, c: number, d: number) => void;
    readonly score_svg: (a: number, b: number) => void;
    readonly score_title: (a: number, b: number) => void;
    readonly susToSvg: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
