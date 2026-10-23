import { PH, PW, fontFor, mulberry32, type Fonts, type Laid, type Line } from "./pages";

function prepare(canvas: HTMLCanvasElement, cssW: number, dpr: number) {
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(((cssW * PH) / PW) * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const k = w / PW;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  return { ctx, k };
}

function eachWord(
  ctx: CanvasRenderingContext2D,
  lines: Line[],
  fonts: Fonts,
  draw: (text: string, x: number, y: number, line: Line, i: number) => void,
) {
  for (const line of lines) {
    const b = line.block;
    ctx.save();
    ctx.translate(b.x, b.y);
    if (b.rot) ctx.rotate((b.rot * Math.PI) / 180);
    ctx.font = fontFor(b, fonts);
    ctx.direction = b.script === "ar" ? "rtl" : "ltr";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    line.words.forEach((w, i) => draw(w.text, w.x0, w.base, line, i));
    ctx.restore();
  }
}

/** The degraded "scan": parchment, stains, foxing, bleed-through, skew, blur and ink spread. */
export function drawScan(canvas: HTMLCanvasElement, laid: Laid, fonts: Fonts, cssW: number, dpr: number) {
  const p = prepare(canvas, cssW, dpr);
  if (!p) return;
  const { ctx, k } = p;
  const { page } = laid;
  const rng = mulberry32(page.seed);

  // Paper base
  const g = ctx.createRadialGradient(PW * 0.45, PH * 0.4, 30, PW / 2, PH / 2, PW * 0.9);
  g.addColorStop(0, "#ecdfbf");
  g.addColorStop(0.55, "#ddc89d");
  g.addColorStop(1, "#ae8f5c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PW, PH);

  // Mottling
  for (let i = 0; i < 70; i++) {
    const x = rng() * PW;
    const y = rng() * PH;
    const r = 20 + rng() * 70;
    const m = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rng() > 0.45;
    m.addColorStop(0, dark ? "rgba(120,86,40,0.07)" : "rgba(255,246,220,0.08)");
    m.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = m;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Paper fibres
  ctx.lineWidth = 0.4;
  for (let i = 0; i < 420; i++) {
    const x = rng() * PW;
    const y = rng() * PH;
    const a = rng() * Math.PI;
    const l = 2 + rng() * 9;
    ctx.strokeStyle = `rgba(90,62,28,${0.04 + rng() * 0.06})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }

  // Bleed-through from the verso (mirrored, faint)
  ctx.save();
  ctx.translate(PW, 6);
  ctx.scale(-1, 1);
  ctx.globalAlpha = 0.07;
  ctx.filter = `blur(${(1.4 * k).toFixed(2)}px)`;
  ctx.fillStyle = "#3a2410";
  eachWord(ctx, laid.lines, fonts, (t, x, y) => ctx.fillText(t, x, y + 9));
  ctx.restore();

  // Main text, skewed and degraded
  ctx.save();
  ctx.translate(PW / 2 + 2, PH / 2 - 3);
  ctx.rotate((page.skew * Math.PI) / 180);
  ctx.translate(-PW / 2, -PH / 2);
  const inkRng = mulberry32(page.seed + 99);
  eachWord(ctx, laid.lines, fonts, (t, x, y, line, i) => {
    const w = line.words[i];
    const fade = 0.55 + 0.4 * inkRng() - (1 - w.conf) * 0.6;
    const dy = (inkRng() - 0.5) * 0.9;
    const ink = line.block.ink ?? "#2b1a0b";
    // ink spread halo
    ctx.globalAlpha = Math.max(0.12, fade * 0.45);
    ctx.filter = `blur(${(1.1 * k).toFixed(2)}px)`;
    ctx.fillStyle = ink;
    ctx.fillText(t, x + 0.4, y + dy + 0.3);
    // body of the glyphs, slightly soft
    ctx.globalAlpha = Math.max(0.2, fade);
    ctx.filter = `blur(${(0.45 * k).toFixed(2)}px)`;
    ctx.fillText(t, x, y + dy);
  });
  ctx.restore();
  ctx.filter = "none";
  ctx.globalAlpha = 1;

  // Water stains with tide lines
  for (const s of page.stains) {
    const st = ctx.createRadialGradient(s.x, s.y, s.r * 0.1, s.x, s.y, s.r);
    st.addColorStop(0, "rgba(150,104,48,0.20)");
    st.addColorStop(0.75, "rgba(140,95,40,0.16)");
    st.addColorStop(0.93, "rgba(110,70,25,0.30)");
    st.addColorStop(1, "rgba(110,70,25,0)");
    ctx.fillStyle = st;
    ctx.beginPath();
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = s.r * (0.88 + rng() * 0.14);
      const x = s.x + Math.cos(a) * rr;
      const y = s.y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Foxing
  for (let i = 0; i < 46; i++) {
    const x = rng() * PW;
    const y = rng() * PH;
    const r = 0.6 + rng() * 2.6;
    ctx.fillStyle = `rgba(122,74,30,${0.15 + rng() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fold crease
  const cy = PH * 0.47;
  const cr = ctx.createLinearGradient(0, cy - 6, 0, cy + 6);
  cr.addColorStop(0, "rgba(0,0,0,0)");
  cr.addColorStop(0.45, "rgba(80,52,20,0.16)");
  cr.addColorStop(0.55, "rgba(255,248,228,0.18)");
  cr.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = cr;
  ctx.fillRect(0, cy - 6, PW, 12);

  // Grain
  const n = document.createElement("canvas");
  n.width = n.height = 128;
  const nctx = n.getContext("2d");
  if (nctx) {
    const img = nctx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 120 + rng() * 135;
      img.data[i] = v;
      img.data[i + 1] = v * 0.94;
      img.data[i + 2] = v * 0.84;
      img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
    const pat = ctx.createPattern(n, "repeat");
    if (pat) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.32;
      ctx.scale(0.6, 0.6);
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, PW / 0.6, PH / 0.6);
      ctx.restore();
    }
  }

  // Edge burn
  const edges: [number, number, number, number][] = [
    [0, 0, 26, 0],
    [PW, 0, PW - 26, 0],
    [0, 0, 0, 26],
    [0, PH, 0, PH - 26],
  ];
  for (const [x0, y0, x1, y1] of edges) {
    const e = ctx.createLinearGradient(x0, y0, x1, y1);
    e.addColorStop(0, "rgba(70,44,16,0.45)");
    e.addColorStop(1, "rgba(70,44,16,0)");
    ctx.fillStyle = e;
    ctx.fillRect(0, 0, PW, PH);
  }

  // Chipped corner
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.moveTo(PW, PH - 54);
  ctx.lineTo(PW - 10, PH - 30);
  ctx.lineTo(PW - 22, PH - 12);
  ctx.lineTo(PW - 46, PH);
  ctx.lineTo(PW, PH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The recognised, deskewed rendering. */
export function drawClean(canvas: HTMLCanvasElement, laid: Laid, fonts: Fonts, cssW: number, dpr: number) {
  const p = prepare(canvas, cssW, dpr);
  if (!p) return;
  const { ctx } = p;
  ctx.fillStyle = "#F3F0E8";
  ctx.fillRect(0, 0, PW, PH);
  ctx.strokeStyle = "rgba(76,157,171,0.09)";
  ctx.lineWidth = 0.5;
  for (let x = 24; x < PW; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, PH);
    ctx.stroke();
  }
  for (let y = 24; y < PH; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(PW, y);
    ctx.stroke();
  }
  eachWord(ctx, laid.lines, fonts, (t, x, y, line) => {
    ctx.fillStyle = line.block.kind === "margin" || line.block.kind === "catchword" ? "#4a3d2a" : "#14161c";
    ctx.fillText(t, x, y);
  });
}
