// Where the engine finds things. The page configures this once per episode
// (asset host, JP asset index, the episode's kind); every engine module reads
// URLs from here instead of hard-coding paths.
//
// Game assets come from the JP tree of the asset host. The player's own
// converted files (effects, UI sprites, fonts) sit under
// "jp-assets/story-player/v1/" on the same host.

/** One Live2D costume of the JP tree (the backend's jp-index entry). */
export interface StoryModelEntry {
  dir: string;
  model3: string;
  physics?: string;
  motionBase?: string;
  /** costume-only clips in "<dir>/motions/" (lower-case names) */
  motions?: string[];
}

export interface StoryAssetIndex {
  version: string;
  models: Record<string, StoryModelEntry>;
  movies: Record<string, string>;
  se: Record<string, string>;
}

/** The episode being played. */
export interface StoryEpisodeContext {
  index: StoryAssetIndex;
  /** "event" | "unit" | "card" | "special" | "area" */
  kind: string;
  /** event stories: the event bundle (event-only SEs live next to its scenarios) */
  eventBundle?: string;
}

const PLAYER_DIR = "story-player/v1";

let jpRoot = "";
let episode: StoryEpisodeContext | undefined;

/** e.g. "https://sekai-assets.haruki.seiunx.com/jp-assets" (the user's asset host) */
export function configureStoryRoot(root: string) {
  jpRoot = root.replace(/\/+$/, "");
}

export function configureStoryEpisode(next: StoryEpisodeContext) {
  episode = next;
}

function current(): StoryEpisodeContext {
  if (!episode) throw new Error("story episode is not configured");
  return episode;
}

const jp = (path: string) => `${jpRoot}/${path}`;

export const storyUrls = {
  /** any file of the JP tree */
  asset: (path: string) => jp(path),
  /** converted UI sprites ("menu/btn.png", "chr_ts/map.json", ...) */
  ui: (path: string) => jp(`${PLAYER_DIR}/ui/${path}`),
  /** converted scenario effects ("<name>/effect.json", "bg/index.json") */
  fxRoot: () => jp(`${PLAYER_DIR}/fx`),
  fonts: (file: string) => jp(`${PLAYER_DIR}/fonts/${file}`),
  /** third-party runtime files (the Live2D Cubism core) */
  lib: (file: string) => jp(`${PLAYER_DIR}/lib/${file}`),

  bgm: (id: string) => [
    jp(`ondemand/sound/scenario/bgm/${id}/${id}.mp3`),
    jp(`startapp/sound/scenario/bgm/${id}/${id}.mp3`),
  ],
  // shared SEs by name; a name the shared packs lack is an event-only SE
  se: (id: string) => {
    const c = current();
    const shared = c.index.se[id];
    if (shared) return [jp(shared)];
    return c.eventBundle ? [jp(`ondemand/event_story/${c.eventBundle}/scenario_se/${id}.mp3`)] : [];
  },
  voice: (scenarioId: string, voiceId: string) => {
    const dirs = ["ondemand/sound/scenario/voice", "ondemand/sound/card_scenario/voice", "startapp/sound/scenario/voice"];
    if (current().kind === "card") dirs.unshift(dirs.splice(1, 1)[0]);
    return dirs.map((d) => jp(`${d}/${scenarioId}/${voiceId}.mp3`));
  },
  background: (id: string) => [
    jp(`ondemand/scenario/background/${id}/${id}.png`),
    jp(`startapp/scenario/background/${id}/${id}.png`),
    // prefab backgrounds (ScenarioBGData): the base image
    jp(`ondemand/scenario/background/${id}/scenariobgdata.assets/texture2d/${id}.png`),
  ],
  movie: (name: string) => {
    const p = current().index.movies[name];
    return p ? jp(p) : null;
  },

  model: (costume: string) => current().index.models[costume],
  modelBase: (m: StoryModelEntry) => jp(`${m.dir}/`),
  /**
   * A motion or facial clip. Exports are lower-case. A body clip the shared
   * library lacks may be costume-only (BuildModelData AdditionalMotionData):
   * this costume's motions/ first, then the other costumes of the character.
   */
  clip: (m: StoryModelEntry, kind: "motion" | "facial", name: string) => {
    const n = name.toLowerCase();
    if (kind === "motion") {
      const owner = m.motions?.includes(n) ? m : undefined;
      const sibling = owner ?? findSiblingClip(m, n);
      if (sibling) return jp(`${sibling.dir}/motions/${n}.motion3.json`);
    }
    return m.motionBase ? jp(`${m.motionBase}/${kind}/${n}.motion3.json`) : null;
  },
};

function findSiblingClip(m: StoryModelEntry, clip: string): StoryModelEntry | undefined {
  const parent = m.dir.slice(0, m.dir.lastIndexOf("/") + 1);
  for (const e of Object.values(current().index.models))
    if (e !== m && e.dir.startsWith(parent) && e.motions?.includes(clip)) return e;
  return undefined;
}
