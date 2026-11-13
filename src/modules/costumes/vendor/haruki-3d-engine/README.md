# haruki-3d-engine (vendored browser build)

Prebuilt CostumeShop entry of the Haruki-3D engine (`haruki-3d-engine/costume_shop`, `bun run build:lib`), with the
chunks it loads. The kernel reads original game content supplied by the host (see the engine's `docs/api.md`,
"Content"): the AssetBundleInfo, original bundles and master rows. Here they come from the Toolbox backend's
`/api/misc/costume3d/<region>/` (raw-bundle mirror layout plus `master/characters/<id>.json`) through
`createMirrorContent(base, { masterLayout: "characters" })`; see `../../lib/costume-content.ts`.

Built from Prsk-3D `a8219538`.

Files:

- `haruki-3d-engine-costume-shop.js` — the entry: `createHaruki3DKernel`, `createMirrorContent`, `listRoleParts`
- `costume_shop-*.js`, `mirrorContent-*.js`, `unityPrefabRuntime-*.js` — the kernel and its runtime
- `originalPartWorker-*.js`, `assets/originalPartWorker-*.js` — the worker that reads the bundles (MessagePack and the
  ASTC decoder are bundled into it)
- `Sekai_Live_*.js` — the official shader tables, each loaded only when a material uses it
- `haruki-3d-engine-costume-shop.d.ts` — hand-written declarations mirroring upstream `docs/api.md`

`three` is the Toolbox's own dependency (imported as `three`).

To update: `bun run build:lib` in the engine repo, copy `dist/haruki-3d-engine-costume-shop.js` and every file it
reaches through relative imports and `new URL("assets/…", import.meta.url)` (keeping `assets/`), drop the trailing
`//# sourceMappingURL=` lines (the `.map` files are not vendored), and update the `.d.ts` when the API changes.
`vendor-api.test.ts` checks the exports and that every relative import resolves. Do not edit the generated files by
hand otherwise.
