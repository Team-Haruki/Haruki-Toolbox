// Render reproducible examples with synthetic user data using the same Drawing
// endpoints as HarukiBot. Inputs: backend catalog JSON and Drawing URL.
// No production user data is read.
import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

const [catalogPath, renderer] = process.argv.slice(2)
if (!catalogPath || !renderer) throw new Error("Usage: node scripts/build-sponsor-frame-previews.mjs <catalog.json> <drawing-url>")
const catalog = JSON.parse(await readFile(catalogPath, "utf8"))
const output = path.resolve("public/sponsor-frames")
await mkdir(output, { recursive: true })
const names = ["ick", "saki", "hnm", "shiho", "mnr", "hrk", "airi", "szk", "khn", "an", "akt", "toya", "tks", "emu", "nene", "rui", "knd", "mfy", "ena", "mzk", "miku", "rin", "len", "luka", "meiko", "kaito"]
const staticPath = (name) => `static_images/${name}`

for (const frame of [null, ...catalog]) {
  const id = frame?.id ?? "default"
  if (!/^[a-z0-9_]+$/.test(id)) throw new Error("Invalid frame ID")
  const paths = frame ? { ...frame.horizontal, frame_type: "single", horizontal: frame.horizontal, vertical: frame.vertical } : null
  const profile = {
    id: "1234567890", region: "cn", nickname: "赞助用户示例", account_label: "示例账号", region_label: "国服（CN）",
    leader_image_path: staticPath("chara_icon/knd.png"), has_frame: !!frame, frame_paths: paths,
  }
  const panel = { profile, rank: 200, mysekai_level: 30, data_sources: [{ name: "示例数据", source: "头像框效果预览" }], bg_alpha: 100, dt: 1792108800 }
  const full = {
    profile, rank: 200, word: "感谢你的支持！这是头像框效果示例。", twitter_id: "HarukiBot",
    pcards: ["knd", "mfy", "ena", "mzk", "miku"].map((name, i) => ({
      card_id: i + 1, card_thumbnail_path: staticPath(`chara_icon/${name}.png`), rare: "rarity_4",
      frame_img_path: staticPath("card/frame_rarity_4.png"), attr_img_path: staticPath("card/attr_cool.png"),
      rare_img_path: staticPath("card/rare_star_normal.png"), train_rank: 0, level: 60,
    })),
    bg_settings: { blur: 4, alpha: 100, vertical: true }, honors: [],
    music_difficulty_count: ["easy", "normal", "hard", "expert", "master", "append"].map((difficulty) => ({ difficulty, clear: 100, fc: 80, ap: 39 })),
    character_rank: names.map((_, i) => ({ character_id: i + 1, rank: 39 })),
    chara_rank_icon_path_map: Object.fromEntries(names.map((name, i) => [String(i + 1), staticPath(`chara_rank_icon/${name}.png`)])),
    lv_rank_bg_path: staticPath("lv_rank_bg.png"), x_icon_path: staticPath("x_icon.png"),
    icon_clear_path: staticPath("icon_clear.png"), icon_fc_path: staticPath("icon_fc.png"), icon_ap_path: staticPath("icon_ap.png"), frame_paths: paths, dt: 1792108800,
  }
  for (const [suffix, endpoint, payload, mime] of [["panel.png", "/api/pjsk/profile/info-panel", panel, "image/png"], ["profile.jpg", "/api/pjsk/profile", full, "image/jpeg"]]) {
    const response = await fetch(new URL(endpoint, renderer), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30_000) })
    if (!response.ok || !response.headers.get("content-type")?.startsWith(mime)) throw new Error(`Render failed: ${id}/${suffix} (${response.status})`)
    if (Number(response.headers.get("X-Haruki-Missing-Assets") ?? "0") > 0) throw new Error(`Missing preview assets: ${id}`)
    await writeFile(path.join(output, `${id}-${suffix}`), Buffer.from(await response.arrayBuffer()))
  }
  console.log(`Rendered ${id}`)
}

// A static preview inventory also lets browser tests check every shipped image.
await writeFile(path.join(output, "catalog.json"), JSON.stringify(catalog.map(({ id, name, thumbnail, panelPreview, profilePreview }) => ({ id, name, thumbnail, panelPreview, profilePreview })), null, 2) + "\n")
