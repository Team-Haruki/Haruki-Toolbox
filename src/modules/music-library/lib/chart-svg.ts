/**
 * Fixes applied to the SVG the chart engine returns before a browser shows it.
 *
 * A note is drawn in three parts: the two end caps, and a middle that is the
 * sprite stretched 1200× sideways so that only its centre columns show. The
 * engine writes that middle `<image>` without `preserveAspectRatio="none"`,
 * so a browser keeps the sprite's proportions instead of stretching it: the
 * middle lands far outside the clip and every note shows as two bare caps.
 * (The engine's own PNG/JPEG renderer stretches it, which is why the bot's
 * charts are fine.)
 */
const MIDDLE_SYMBOL_IMAGE = /(<symbol id="notes-\d+-middle"[^>]*>\s*<image\b)([^>]*)>/g

export function stretchChartNoteMiddles(svg: string): string {
  return svg.replace(MIDDLE_SYMBOL_IMAGE, (match, open: string, rest: string) => {
    if (rest.includes("preserveAspectRatio")) {
      return match
    }
    // `rest` is the attributes, with the "/" of a self-closing tag at its end.
    const selfClosing = rest.trimEnd().endsWith("/")
    const attributes = (selfClosing ? rest.trimEnd().slice(0, -1) : rest).trimEnd()
    return `${open}${attributes} preserveAspectRatio="none"${selfClosing ? "/>" : ">"}`
  })
}

/**
 * Fonts for a browser: the engine's theme names fonts by what the bot's
 * server has installed, so the labels fall back to the page's own stack.
 */
export const CHART_WEB_FONT_CSS = `
.title, .subtitle, .lyric-text, .skill-score {
    font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Noto Sans CJK JP", "Yu Gothic", Meiryo, "PingFang SC", "Microsoft YaHei", sans-serif;
}
.bar-count-text, .event-text, .speed-text, .tick-text {
    font-family: ui-sans-serif, system-ui, "Avenir Next", Avenir, "Segoe UI", Roboto, sans-serif;
}
`
