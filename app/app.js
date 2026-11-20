// Vice Cover Studio — turns your photos into multi-panel cover art.
//
// Everything happens on one canvas: pick a layout, drop photos into the
// panels, drag and zoom each one, choose a colour grade, letter a title
// over the top, and export a 1080x1440 poster. No uploads, no network —
// the photos never leave the page.

const W = 1080;
const H = 1440;
const MARGIN = 30;
const GUTTER = 14;

const canvas = document.querySelector("#cover");
const ctx = canvas.getContext("2d");
const $ = (sel) => document.querySelector(sel);

// A layout is a list of rows; each row has a height fraction and column
// width fractions. Rects are resolved against the poster with margins and
// gutters, so every layout fills the same frame.
const LAYOUTS = {
  classic: [
    { h: 0.27, cols: [1] },
    { h: 0.33, cols: [0.5, 0.5] },
    { h: 0.40, cols: [1 / 3, 1 / 3, 1 / 3] },
  ],
  grid: [
    { h: 1 / 3, cols: [1 / 3, 1 / 3, 1 / 3] },
    { h: 1 / 3, cols: [1 / 3, 1 / 3, 1 / 3] },
    { h: 1 / 3, cols: [1 / 3, 1 / 3, 1 / 3] },
  ],
  hero: [
    { h: 1, cols: [0.64, 0.36], stacks: [1, 3] },
  ],
};

function layoutRects(name) {
  const rows = LAYOUTS[name];
  const innerW = W - MARGIN * 2;
  const innerH = H - MARGIN * 2;
  const rects = [];
  let y = MARGIN;
  rows.forEach((row, ri) => {
    const rowH = row.h * innerH - (ri < rows.length - 1 ? GUTTER / 2 : 0);
    let x = MARGIN;
    row.cols.forEach((frac, ci) => {
      const colW = frac * innerW - (ci < row.cols.length - 1 ? GUTTER / 2 : 0);
      const stack = row.stacks ? row.stacks[ci] : 1;
      const cellH = (rowH - GUTTER * (stack - 1)) / stack;
      for (let s = 0; s < stack; s++) {
        rects.push({ x, y: y + s * (cellH + GUTTER), w: colW, h: cellH });
      }
      x += colW + GUTTER;
    });
    y += rowH + GUTTER;
  });
  return rects;
}

const GRADES = {
  sunset: { filter: "saturate(1.45) contrast(1.14) brightness(1.05)", top: "rgba(255,110,60,0.20)", bottom: "rgba(24,0,54,0.28)" },
  neon: { filter: "saturate(1.3) contrast(1.22) hue-rotate(-8deg)", top: "rgba(0,229,255,0.12)", bottom: "rgba(120,0,90,0.26)" },
  day: { filter: "saturate(1.32) contrast(1.08) brightness(1.13)", top: "rgba(255,220,130,0.14)", bottom: "rgba(255,110,60,0.12)" },
  none: { filter: "none", top: "rgba(0,0,0,0)", bottom: "rgba(0,0,0,0)" },
};

const SAMPLES = ["samples/sunset.jpg", "samples/pier.jpg", "samples/portrait.jpg"];

const state = {
  layout: "classic",
  grade: "sunset",
  grain: true,
  title: "LEONIDA NIGHTS",
  subtitle: "A VICE CITY STORY",
  panels: [], // { img: HTMLImageElement|null, zoom, ox, oy } per rect
  selected: 0,
};

function blankPanel() {
  return { img: null, zoom: 1, ox: 0.5, oy: 0.5 };
}

function syncPanels() {
  const count = layoutRects(state.layout).length;
  while (state.panels.length < count) state.panels.push(blankPanel());
  state.panels.length = count;
  if (state.selected >= count) state.selected = 0;
}

function loadInto(index, src) {
  const img = new Image();
  img.onload = () => {
    state.panels[index] = { img, zoom: 1, ox: 0.5, oy: 0.5 };
    if (index === state.selected) $("#zoom-range").value = "1";
    render(true);
  };
  img.src = src;
}

// Film grain: one noise tile, generated once, drawn over the poster.
const grainTile = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 180;
  const g = c.getContext("2d");
  const data = g.createImageData(180, 180);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 118 + Math.random() * 60;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  return c;
})();


function drawPanel(rect, panel, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (panel.img) {
    const img = panel.img;
    const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * panel.zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = rect.x + (rect.w - dw) * panel.ox;
    const dy = rect.y + (rect.h - dh) * panel.oy;
    ctx.filter = grade.filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = "none";
  } else {
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    grad.addColorStop(0, "#3a1658");
    grad.addColorStop(1, "#160a2a");
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "rgba(246,238,252,0.55)";
    ctx.font = "600 26px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Click to add a photo", rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.textAlign = "left";
  }
  const shade = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  shade.addColorStop(0, grade.top);
  shade.addColorStop(1, grade.bottom);
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  ctx.strokeStyle = "#050208";
  ctx.lineWidth = 12;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

function drawTitle() {
  const title = (state.title || "").trim();
  if (!title) return;
  ctx.save();
  ctx.textAlign = "center";
  let size = 118;
  ctx.font = `italic 900 ${size}px 'Arial Black', Impact, sans-serif`;
  while (ctx.measureText(title).width > W - 120 && size > 40) {
    size -= 6;
    ctx.font = `italic 900 ${size}px 'Arial Black', Impact, sans-serif`;
  }
  const y = MARGIN + size * 0.98;
  const fill = ctx.createLinearGradient(0, y - size, 0, y + size * 0.25);
  fill.addColorStop(0, "#ffffff");
  fill.addColorStop(0.55, "#ffd76a");
  fill.addColorStop(1, "#ff7a45");
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.lineWidth = size / 7;
  ctx.strokeStyle = "#0a0512";
  ctx.strokeText(title, W / 2, y);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = fill;
  ctx.fillText(title, W / 2, y);
  const sub = (state.subtitle || "").trim();
  if (sub) {
    ctx.font = "700 34px 'Segoe UI', sans-serif";
    const spaced = sub.split("").join("  ");
    ctx.lineWidth = 7;
    ctx.strokeText(spaced, W / 2, y + 58);
    ctx.fillStyle = "#f6eefc";
    ctx.fillText(spaced, W / 2, y + 58);
  }
  ctx.restore();
}

function render(showSelection) {
  syncPanels();
  const rects = layoutRects(state.layout);
  const grade = GRADES[state.grade];
  ctx.fillStyle = "#050208";
  ctx.fillRect(0, 0, W, H);
  rects.forEach((rect, i) => drawPanel(rect, state.panels[i], grade));
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = "overlay";
    const pattern = ctx.createPattern(grainTile, "repeat");
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  drawTitle();
  if (showSelection) {
    const rect = rects[state.selected];
    ctx.strokeStyle = "#40e0ff";
    ctx.lineWidth = 6;
    ctx.setLineDash([18, 12]);
    ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
    ctx.setLineDash([]);
  }
  const label = $("#panel-label");
  if (label) {
    label.textContent = `Panel ${state.selected + 1} of ${rects.length} — click any panel on the cover to select it, drag the photo to reposition it.`;
  }
}

function exportAs(type) {
  render(false);
  canvas.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = type === "image/png" ? "vice-cover.png" : "vice-cover.jpg";
    a.click();
    URL.revokeObjectURL(a.href);
    render(true);
  }, type, 0.92);
}


// ---- Controls ----------------------------------------------------------

function segWire(id, key, after) {
  $(id).addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-layout], button[data-grade]");
    if (!btn) return;
    $(id).querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === btn));
    state[key] = btn.dataset.layout || btn.dataset.grade;
    if (after) after();
    render(true);
  });
}
segWire("#layout-seg", "layout", syncPanels);
segWire("#grade-seg", "grade");

$("#grain-toggle").addEventListener("change", (ev) => { state.grain = ev.target.checked; render(true); });
$("#title-input").addEventListener("input", (ev) => { state.title = ev.target.value.toUpperCase(); render(true); });
$("#subtitle-input").addEventListener("input", (ev) => { state.subtitle = ev.target.value.toUpperCase(); render(true); });

$("#photo-file").addEventListener("change", (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  loadInto(state.selected, url);
  ev.target.value = "";
});
document.querySelectorAll("[data-sample]").forEach((btn) => {
  btn.addEventListener("click", () => loadInto(state.selected, btn.dataset.sample));
});
$("#clear-panel").addEventListener("click", () => {
  state.panels[state.selected] = blankPanel();
  render(true);
});
$("#center-btn").addEventListener("click", () => {
  const p = state.panels[state.selected];
  p.ox = 0.5; p.oy = 0.5;
  render(true);
});
$("#zoom-range").addEventListener("input", (ev) => {
  state.panels[state.selected].zoom = Number(ev.target.value);
  render(true);
});
$("#surprise-btn").addEventListener("click", () => {
  syncPanels();
  state.panels.forEach((_, i) => loadInto(i, SAMPLES[i % SAMPLES.length]));
});
$("#export-png").addEventListener("click", () => exportAs("image/png"));
$("#export-jpg").addEventListener("click", () => exportAs("image/jpeg"));

// ---- Canvas interaction: select, drag to pan, wheel to zoom -----------

function canvasPoint(ev) {
  const r = canvas.getBoundingClientRect();
  return { x: (ev.clientX - r.left) * (W / r.width), y: (ev.clientY - r.top) * (H / r.height) };
}

let drag = null;
canvas.addEventListener("pointerdown", (ev) => {
  const pt = canvasPoint(ev);
  const rects = layoutRects(state.layout);
  const hit = rects.findIndex((r) => pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h);
  if (hit >= 0) {
    state.selected = hit;
    $("#zoom-range").value = String(state.panels[hit].zoom);
  }
  drag = { x: pt.x, y: pt.y };
  canvas.setPointerCapture(ev.pointerId);
  render(true);
});
canvas.addEventListener("pointermove", (ev) => {
  if (!drag) return;
  const pt = canvasPoint(ev);
  const rect = layoutRects(state.layout)[state.selected];
  const panel = state.panels[state.selected];
  if (panel.img && rect) {
    const scale = Math.max(rect.w / panel.img.naturalWidth, rect.h / panel.img.naturalHeight) * panel.zoom;
    const overflowX = Math.max(1, panel.img.naturalWidth * scale - rect.w);
    const overflowY = Math.max(1, panel.img.naturalHeight * scale - rect.h);
    panel.ox = Math.min(1, Math.max(0, panel.ox - (pt.x - drag.x) / overflowX));
    panel.oy = Math.min(1, Math.max(0, panel.oy - (pt.y - drag.y) / overflowY));
  }
  drag = { x: pt.x, y: pt.y };
  render(true);
});
canvas.addEventListener("pointerup", () => { drag = null; });
canvas.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const panel = state.panels[state.selected];
  panel.zoom = Math.min(3, Math.max(1, panel.zoom * (ev.deltaY < 0 ? 1.06 : 0.94)));
  $("#zoom-range").value = String(panel.zoom);
  render(true);
}, { passive: false });

// ---- Start: a finished cover on first paint ----------------------------

syncPanels();
state.panels.forEach((_, i) => loadInto(i, SAMPLES[i % SAMPLES.length]));
render(true);
