// Vice Cover Studio — hand-in program for gta6-cover-art-01.
//
// The product is the static web app in app/ (open app/index.html; it runs
// entirely offline). This program copies app/ and screenshots/ into the
// output directory and writes dossier.json with the vendored make.fun
// library exactly as the scorer's copy writes it — vendor/makefun-app.ts
// is left byte-for-byte as the kit shipped it.
//
// Run locally:  MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Pre-flight: the review opens the app offline and the gate wants 3-4
// screenshots of at most 256 KiB, one of them showing an exported cover.
// Fail here rather than at the scorer.
const shotsDir = join(here, "screenshots");
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f))
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
}
for (const f of shots) {
  const size = statSync(join(shotsDir, f)).size;
  if (size > 262144) throw new Error(`screenshot ${f} is ${size} bytes, over the 256 KiB cap`);
}
for (const sample of ["sunset.jpg", "pier.jpg", "portrait.jpg"]) {
  if (!existsSync(join(here, "app", "samples", sample))) {
    throw new Error(`missing bundled sample app/samples/${sample}`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
console.log(`dossier written to ${out}`);
