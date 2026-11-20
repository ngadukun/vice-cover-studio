# Vice Cover Studio — GTA-style cover art from your own photos

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![make.fun rank](https://make.fun/badge/gta6-cover-art-01/ngadukun/vice-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![make.fun reward](https://make.fun/badge/gta6-cover-art-01/ngadukun/vice-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Entry for make.fun's
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01) bounty:
an offline browser tool that turns a person's photos and a caption into
GTA-style cover art.

## What it does

Open `app/index.html` (or `node serve.ts`, then localhost:8090) and a
finished cover is already on screen — three bundled sample scenes in a
six-panel layout under a Sunset grade. Then make it yours:

- **Any photo, any panel.** Click a panel, upload a photo (or pick a
  sample), drag it to reposition, scroll or slide to zoom. Three layouts:
  Classic Six, Grid Nine, and Hero.
- **The Vice City grade.** Sunset, Neon Night and Day Heat presets rebuilt
  from canvas filters and split-tone overlays — teal shadows, hot
  highlights — plus optional film grain.
- **Lettering.** Your title is set in heavy italic display type with a
  sunset gradient fill and a hard outline, fitted to the poster width;
  a letterspaced subtitle sits beneath it.
- **Export.** One click downloads a 1080 × 1440 PNG or JPG — poster size,
  ready to post. Everything runs locally; photos never leave the page.

The sample scenes are generated in this repo by `make_samples.py` (PIL
gradients and silhouettes), so the tool can be tried — and reviewed —
before a single real photo is uploaded. Unofficial fan tool; not
affiliated with Rockstar Games or Take-Two Interactive, and no official
artwork is used anywhere.

## Screenshots

`screenshots/` (listed in `shots.json`) shows: the studio as it first
opens; the same cover re-graded to Neon Night on the Grid Nine layout;
the Hero layout in Day Heat; and an exported PNG cover on its own.

## Hand-in

`node main.ts` copies `app/` and `screenshots/` to the output directory
and writes `dossier.json` with the vendored make.fun library
(`vendor/makefun-app.ts`, shipped byte-for-byte as the scorer requires).
