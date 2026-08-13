# pjsekai-scores-rs (wasm)

Prebuilt WebAssembly bundle of [Team-Haruki/pjsekai-scores-rs](https://github.com/Team-Haruki/pjsekai-scores-rs)
(v0.4.3, MIT — see `LICENSE`), used for in-browser static chart rendering.

Rebuild from the upstream repo with:

```bash
wasm-pack build --release --target web --no-default-features --features wasm
```

and copy `pkg/pjsekai_scores_rs.js`, `pkg/pjsekai_scores_rs_bg.wasm` and the
two `.d.ts` files here. Do not edit these generated files by hand.
