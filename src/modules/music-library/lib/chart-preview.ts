/**
 * In-browser static chart rendering backed by the vendored
 * pjsekai-scores-rs wasm bundle (see ../wasm/pjsekai-scores/README.md).
 * The wasm module is ~1.3 MB, so it is loaded lazily on first render and
 * shared afterwards.
 */

type ChartEngine = typeof import("../wasm/pjsekai-scores/pjsekai_scores_rs.js")

let enginePromise: Promise<ChartEngine> | null = null

async function loadChartEngine(): Promise<ChartEngine> {
  if (!enginePromise) {
    enginePromise = import("../wasm/pjsekai-scores/pjsekai_scores_rs.js").then(async (module) => {
      await module.default()
      return module
    })
    enginePromise.catch(() => {
      // Allow a retry after a failed wasm fetch instead of caching the failure.
      enginePromise = null
    })
  }

  return enginePromise
}

/** Public note-sprite host used by the upstream renderer's default theme. */
const CHART_NOTE_HOST = "https://asset3.pjsekai.moe/live/note/custom01"

export type ChartSvgRequest = {
  /** Raw `.sus` chart text. */
  sus: string
  title?: string | null
  artist?: string | null
  difficulty?: string | null
  playLevel?: number | null
  musicId?: number | null
  jacketUrl?: string | null
}

/** Renders a `.sus` chart to a standalone SVG string. */
export async function renderChartSvg(request: ChartSvgRequest): Promise<string> {
  const engine = await loadChartEngine()
  const score = engine.Score.fromSus(request.sus)
  try {
    setMetaField(score, "title", request.title)
    setMetaField(score, "artist", request.artist)
    setMetaField(score, "difficulty", request.difficulty)
    setMetaField(score, "playlevel", request.playLevel != null ? String(request.playLevel) : null)
    setMetaField(score, "songid", request.musicId != null ? String(request.musicId) : null)
    setMetaField(score, "jacket", request.jacketUrl)

    const drawing = new engine.Drawing()
    try {
      drawing.setNoteHost(CHART_NOTE_HOST)
      drawing.setGenerator("Haruki Toolbox")
      return drawing.svg(score)
    } finally {
      drawing.free()
    }
  } finally {
    score.free()
  }
}

function setMetaField(
  score: InstanceType<ChartEngine["Score"]>,
  name: string,
  value: string | null | undefined,
): void {
  if (value != null && value !== "") {
    score.setMetaField(name, value)
  }
}
