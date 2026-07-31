# haruki-3d-engine (vendored browser build)

Prebuilt library output of [Team-Haruki/Haruki-3D-Engine](https://github.com/Team-Haruki/Haruki-3D-Engine)
(`npm run build`, lib entry only — the capture harness is not vendored).

Built from `main` plus one pending local patch (worth upstreaming): the kernel
additionally exposes `setCharacterYawDegrees(degrees)` (forwards to the
engine's existing method, re-rendering one frame when paused) so product pages
can implement drag-to-rotate.

Files:

- `haruki-3d-engine.js` — public entry (`createHaruki3DKernel`)
- `Haruki3DKernel-*.js` — kernel chunk (Three.js is bundled/tree-shaken inside)
- `runtimeMessagePackDecodeCore-*.js` + `assets/` — runtime decode core, worker, Brotli WASM
- `haruki-3d-engine.d.ts` — hand-written declarations mirroring upstream `docs/api.md`

The Basis/KTX2 transcoder the kernel loads from `/basis/` lives in
`public/basis/` (copied from the same upstream build).

Runtime packages are consumed from the public asset endpoints under
`/pjsk-3d-output/<region>/` (exported on JP01 by the 3D batch follower).

To update: build the upstream repo and re-copy the files above; do not edit
the generated files by hand.
