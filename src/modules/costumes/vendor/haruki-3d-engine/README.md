# haruki-3d-engine (vendored browser build)

Prebuilt library output of Haruki-3D (`engine/`, formerly the Haruki-3D-Engine repo)
(`npm run build`, lib entry only — the capture harness is not vendored).
Includes the split model/view yaw API: CostumeShop drag rotates CameraRoot via
`setViewYawDegrees` and does not move the assembled character or feed false
inertia into SpringBone.

Files:

- `haruki-3d-engine.js` — public entry (`createHaruki3DKernel`)
- `haruki-3d-engine-costume-shop.js` — CostumeShop entry module (imported by `haruki-3d-engine.js`)
- `CostumeShopKernel-*.js` — CostumeShop kernel chunk
- `animationPlaybackRuntime-*.js` — shared animation/runtime package loader
- `runtimeMessagePackDecodeCore-*.js` + `assets/` — runtime decode core, worker, Brotli WASM
- `haruki-3d-engine.d.ts` — hand-written declarations mirroring upstream `docs/api.md`
- `runtimeMessagePackDecodeCore-*.d.ts` — hand-written declaration for the decode core chunk

The Basis/KTX2 transcoder the kernel loads from `/basis/` lives in
`public/basis/` (copied from the same upstream build).

Runtime packages are consumed from the public asset endpoints under
`/pjsk-3d-output/<region>/` (exported by the 3D batch follower).

To update: build the upstream repo (`npm run build` in `engine/`), re-copy the
generated `.js` files and `assets/` above (the `.d.ts` files are hand-written;
rename the decode-core one to the new hash), drop the trailing
`//# sourceMappingURL=` lines (the `.map` files are not vendored), and point
`useCostumeRoleData.ts` at the new decode-core and Brotli WASM hashes. Do not
edit the generated files by hand otherwise.
