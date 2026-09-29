// Run with Bun: bun scripts/verify-jp7-deck-engine.mjs <private-validation-directory>
// Compares the installed engine (or a supplied build) against a private 0.3.8 baseline.
// Inputs and result JSON stay outside the repository; never commit real suite data.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createSekaiDeckRecommend as createInstalled } from 'haruki-sekai-deck-recommend-cpp'
import { prepareDeckRecommendUserData } from '../src/modules/deck-recommend/lib/user-data-preparation.ts'

if (!process.argv[2]) throw new Error('Usage: bun scripts/verify-jp7-deck-engine.mjs <private-validation-directory>')
const root = resolve(process.argv[2]) + '/'
const candidateDirectory = process.argv[3] ? resolve(process.argv[3]) : null
const createNew = candidateDirectory
  ? (await import(pathToFileURL(candidateDirectory + '/index.js').href)).createSekaiDeckRecommend
  : createInstalled
const { createSekaiDeckRecommend: createOld } = await import(pathToFileURL(root + 'baseline/index.js').href)
assert.equal(JSON.parse(readFileSync(root + 'baseline/package.json', 'utf8')).version, '0.3.8')

// The frontend data helpers share imports with browser stores. Supply inert
// storage, as their unit tests do; no login/session data is read or persisted.
const storage = {
  length: 0,
  clear() {},
  getItem() { return null },
  key() { return null },
  removeItem() {},
  setItem() {},
}
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
Object.defineProperty(globalThis, 'sessionStorage', { value: storage, configurable: true })
const { prepareRecommendUserDataForWasm } = await import('../src/modules/deck-recommend/lib/wasm-user-data.ts')
const { buildDeckRecommendAreaItemOptions } = await import('../src/modules/deck-recommend/lib/area-item-options.ts')
const raw = readFileSync(root + 'suite.json')
const suite = JSON.parse(raw.toString())
const master = Object.fromEntries(readdirSync(root + 'master').filter(x => x.endsWith('.json')).map(x => [x.slice(0, -5), JSON.parse(readFileSync(root + 'master/' + x, 'utf8'))]))
const metas = JSON.parse(readFileSync(root + 'music-metas.json', 'utf8'))
const byId = new Map(master.cards.map((c) => [c.id, c]))
const owned = suite.userCards.filter((c) => byId.has(c.cardId)).sort((a, b) => b.level - a.level || b.masterRank - a.masterRank || b.cardId - a.cardId)
const pick = (char, support) => owned.find((u) => {
  const c = byId.get(u.cardId)
  return c.characterId === char && (support === undefined || c.supportUnit === support)
})?.cardId
const decks = { mixed: [1, 5, 9, 13, 17].map(id => pick(id)), vs: [21, 22, 23, 24, 25].map(id => pick(id, 'none')), unit: [1, 2, 3, 4].map(id => pick(id)).concat(pick(21, 'light_sound')) }
for (const [name, cards] of Object.entries(decks)) {
  assert.ok(cards.every(Number.isInteger), `Suite lacks the cards required for ${name}`)
}
console.log(JSON.stringify({ decks, metasShape: Array.isArray(metas) ? 'array' : Object.keys(metas).slice(0, 3), treeOption: buildDeckRecommendAreaItemOptions(master).find(x => x.id === 56) }))
const engines = { new: await createNew({ moduleOptions: { wasmBinary: readFileSync(candidateDirectory ? candidateDirectory + '/sekai_deck_recommend.wasm' : new URL(import.meta.resolve('haruki-sekai-deck-recommend-cpp/sekai_deck_recommend.wasm'))), printErr: () => { } } }), old: await createOld({ moduleOptions: { wasmBinary: readFileSync(root + 'baseline/sekai_deck_recommend.wasm'), printErr: () => { } } }) }
const musicId = master.musics.find((m) => m.id === 1)?.id ?? master.musics[0].id
for (const engine of Object.values(engines)) {
  engine.loadMasterData('jp', master)
  engine.loadMusicMetas('jp', metas)
}
const results = []
for (const [engineName, engine] of Object.entries(engines)) {
  for (const [deckName, fixed_cards] of Object.entries(decks)) {
    for (const level of [0, 1, 20]) {
      const prepared = prepareDeckRecommendUserData({ userData: suite, masterData: master, areaItemLevelOverrides: level ? [{ areaItemId: 56, level }] : [] })
      const user_data = prepareRecommendUserDataForWasm(prepared.userData)
      for (const mode of engineName === 'new' ? ['by_deck', 'force_on', 'force_off'] : ['by_deck']) {
        try {
          const deck = engine.recommend({ region: 'jp', user_data, live_type: 'multi', music_id: musicId, music_diff: 'expert', target: 'power', algorithm: 'dfs', limit: 1, fixed_cards, multi_unit_bonus_evaluation: mode }).decks[0]
          if (!deck)
            throw new Error('No deck')
          const row = { engine: engineName, deck: deckName, level, mode, total: deck.total_power, base: deck.base_power, area: deck.area_item_bonus_power, gate: deck.gate_bonus_power, cards: deck.cards.map((c) => c.card_id) }
          results.push(row)
          console.log(JSON.stringify(row))
        }
        catch (e) {
          const row = { engine: engineName, deck: deckName, level, mode, error: String(e) }
          results.push(row)
          console.log(JSON.stringify(row))
        }
      }
    }
  }
}
const find = (engine, deck, level, mode = 'by_deck') => results.find(r => r.engine === engine && r.deck === deck && r.level === level && r.mode === mode)
let checks = 0
const check = (value, message) => { assert.ok(value, message); checks++; }
for (const name of Object.keys(decks)) {
  for (const level of [0, 1, 20]) {
    check(!find('new', name, level).error, `new engine ${name}/${level} succeeds`)
  }
  check(find('new', name, 0).total === find('old', name, 0).total, `${name}: no tree preserves legacy power`)
}
for (const level of [1, 20]) {
  check(find('new', 'mixed', level).total === find('new', 'mixed', level, 'force_on').total, 'mixed matches force_on')
  check(find('new', 'mixed', level).total > find('old', 'mixed', level).total, 'mixed gains the formerly missing effect')
  check(find('new', 'mixed', level, 'force_off').total === find('old', 'mixed', level).total, 'force_off matches legacy')
  const gain = find('new', 'mixed', level).total - find('new', 'mixed', 0).total
  check(Math.abs(gain - find('new', 'mixed', 0).base * level / 100) <= 15, 'mixed bonus gain matches base * two effects within per-component rounding')
  check(find('new', 'vs', level).total === find('new', 'vs', level, 'force_off').total, 'all no-support VS is not multi-unit')
  check(find('new', 'unit', level).total === find('new', 'unit', level, 'force_off').total, 'same-unit all-match bonus excludes smaller multi-unit bonus')
}
const treeOption = buildDeckRecommendAreaItemOptions(master).find(x => x.id === 56)
check(treeOption?.maxLevel === 20 && treeOption?.targetsAllCharacters && treeOption?.targetsMultiUnit, 'Toolbox exposes both effects and the correct max level')
const run = (engine, user, fixed_cards, options = {}) => engine.recommend({ region: 'jp', user_data: prepareRecommendUserDataForWasm(user), live_type: 'multi', music_id: musicId, music_diff: 'expert', target: 'power', algorithm: fixed_cards ? 'dfs' : 'dfs_ga', timeout_ms: 1500, limit: 1, fixed_cards, ...options }).decks[0]
const realResults = []
for (const level of [1, 20]) {
  const prepared = prepareDeckRecommendUserData({ userData: suite, masterData: master, areaItemLevelOverrides: [{ areaItemId: 56, level }] }).userData
  const treeRows = prepared.userAreas.flatMap(x => x.areaItems).filter(x => x.areaItemId === 56)
  check(treeRows.length === 1 && treeRows[0].level === level, 'frontend inserts one owned item, not one per effect')
  check(run(engines.new, prepared, decks.mixed).total_power === find('new', 'mixed', level).total, 'default evaluation matches explicit by_deck')
}
for (const scenario of ['gate6', 'gates70', 'gate6-with-70']) {
  const prepared = prepareDeckRecommendUserData({ userData: suite, masterData: master, areaItemLevelOverrides: [{ areaItemId: 56, level: 20 }], mysekaiGateLevel: scenario === 'gate6' ? null : 70 }).userData
  if (scenario !== 'gates70')
    prepared.userMysekaiGates.push({ mysekaiGateId: 6, mysekaiGateLevel: 1 })
  const next = run(engines.new, prepared, decks.mixed)
  check(!!next, scenario + ' succeeds')
  if (scenario === 'gate6')
    check(next.total_power === find('new', 'mixed', 20).total, 'shuffle gate contributes zero')
  const row = { scenario, engine: 'new', total: next.total_power, gate: next.gate_bonus_power }
  try {
    row.oldTotal = run(engines.old, prepared, decks.mixed).total_power
  }
  catch (e) {
    row.oldError = String(e)
  }
  if (scenario !== 'gates70')
    check(typeof row.oldError === 'string' && row.oldError.includes('mysekaiGateId=6'), 'legacy engine reproduces shuffle failure')
  realResults.push(row)
  console.log(JSON.stringify(row))
}
for (const level of [0, 20]) {
  const prepared = prepareDeckRecommendUserData({ userData: suite, masterData: master, areaItemLevelOverrides: level ? [{ areaItemId: 56, level }] : [] }).userData
  const start = performance.now()
  const next = run(engines.new, prepared)
  check(!!next && next.cards.length === 5, 'full real card collection produces a recommendation')
  const chosen = next.cards.map((c) => c.card_id)
  check(next.total_power === run(engines.new, prepared, chosen).total_power, 'search result matches fixed deck recalculation')
  const row = { scenario: 'full-collection-search', level, total: next.total_power, area: next.area_item_bonus_power, cards: chosen, elapsedMs: Math.round(performance.now() - start) }
  realResults.push(row)
  console.log(JSON.stringify(row))
}
for (const level of [15, 19, 20]) {
  const user = prepareDeckRecommendUserData({ userData: suite, masterData: master, areaItemLevelOverrides: [{ areaItemId: 56, level }] }).userData
  const upgrades = engines.new.recommendAreaItems({ region: 'jp', card_ids: decks.mixed, user_data: prepareRecommendUserDataForWasm(user) })
  const tree = upgrades.find((x) => x.area_item_id === 56)
  if (level === 20)
    check(!tree, 'max-level tree has no further upgrade')
  else {
    check(!!tree && tree.next_level === level + 1, 'tree next-level recommendation')
    check(tree.shop_item_id === 2100 + level + 1, 'tree shop id at high levels')
    const nextUser = prepareDeckRecommendUserData({ userData: suite, masterData: master, areaItemLevelOverrides: [{ areaItemId: 56, level: level + 1 }] }).userData
    const expected = run(engines.new, nextUser, decks.mixed).total_power - run(engines.new, user, decks.mixed).total_power
    check(tree.power === expected, 'tree upgrade predicted gain equals full deck recalculation')
  }
  const row = { scenario: 'area-upgrade', level, tree: tree ?? null }
  realResults.push(row)
  console.log(JSON.stringify(row))
}
for (const [name, fixed] of Object.entries(decks)) {
  const isolated = prepareDeckRecommendUserData({ userData: suite, masterData: master, areaItemLevelOverrides: [{ areaItemId: 56, level: 20 }] }).userData
  isolated.userAreas = [{ areaId: 27, areaItems: [{ areaItemId: 56, level: 20 }] }]
  const auto = run(engines.new, isolated, fixed)
  const on = run(engines.new, isolated, fixed, { multi_unit_bonus_evaluation: 'force_on' })
  const off = run(engines.new, isolated, fixed, { multi_unit_bonus_evaluation: 'force_off' })
  check(on.total_power > off.total_power, 'isolated tree makes the conditional effect observable')
  check(auto.total_power === (name === 'vs' ? off : on).total_power, 'isolated deck classification: ' + name)
  const row = { scenario: 'isolated-tree', deck: name, auto: auto.total_power, on: on.total_power, off: off.total_power }
  realResults.push(row)
  console.log(JSON.stringify(row))
}
const afterRaw = readFileSync(root + 'suite.json')
check(raw.equals(afterRaw), 'downloaded source suite is unchanged')
for (const e of Object.values(engines))
  e.dispose()
writeFileSync(root + 'results.json', JSON.stringify({ sourceCommit: readFileSync(root + 'source-commit.txt', 'utf8').trim(), suiteSha256: createHash('sha256').update(raw).digest('hex'), ownedCards: owned.length, checks, decks, results, realResults }, null, 2))
console.log(JSON.stringify({ checks, status: 'passed' }))
