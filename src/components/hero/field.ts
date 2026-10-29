import * as THREE from "three";
import { ARABIC_GLYPHS, LATIN_GLYPHS } from "./glyphAtlas";
import { buildLineLayout, mulberry32, sampleMonogram } from "./layout";

export const CAM_Z = 10;
export const FOV = 45;
export const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

export type Built = {
  points: THREE.BufferGeometry;
  links: THREE.BufferGeometry;
  atlas: THREE.Texture;
  slotW: number;
};

/** Where the monogram and the "page" of lines sit, in world units at z=0. */
export function layoutFor(aspect: number, slotW: number) {
  const halfH = TAN * CAM_Z;
  const halfW = halfH * aspect;
  const wide = aspect >= 1;
  const monoCenter = wide ? new THREE.Vector2(halfW * 0.46, halfH * 0.02) : new THREE.Vector2(0, halfH * 0.42);
  const monoScale = wide ? Math.min(halfH * 1.15, halfW * 0.62) : Math.min(halfW * 1.1, halfH * 0.6);
  const lineExtent = wide ? new THREE.Vector2(halfW * 0.84, halfH * 0.66) : new THREE.Vector2(halfW * 0.86, halfH * 0.66);
  const lineOffset = wide ? new THREE.Vector2(0, -halfH * 0.04) : new THREE.Vector2(0, 0);
  return {
    half: new THREE.Vector2(halfW, halfH),
    monoCenter,
    monoScale,
    lineExtent,
    lineOffset,
    lineGlyph: slotW * lineExtent.x * 1.3,
  };
}

export function buildField(count: number, mobile: boolean, aspect: number): Omit<Built, "atlas"> {
  const rand = mulberry32(20240611);
  const ext = layoutFor(aspect, 1);
  const page = buildLineLayout(mobile, rand, ext.lineExtent.x / ext.lineExtent.y);
  const slots = Math.min(page.count, Math.floor(count * 0.6));
  const mono = sampleMonogram(count, rand);
  const AR = ARABIC_GLYPHS.length;
  const LA = LATIN_GLYPHS.length;

  const home = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  const monoPos = new Float32Array(count * 2);
  const monoW = new Float32Array(count);
  const line = new Float32Array(count * 2);
  const lineW = new Float32Array(count);
  const delay = new Float32Array(count);
  const entity = new Float32Array(count);
  const glyph = new Float32Array(count);

  // random permutation so page slots are spread across the volume
  const perm = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const slotOf = new Int32Array(count).fill(-1);
  const particleOfSlot = new Int32Array(slots);
  for (let s = 0; s < slots; s++) {
    slotOf[perm[s]] = s;
    particleOfSlot[s] = perm[s];
  }

  for (let i = 0; i < count; i++) {
    home[i * 3] = rand() * 2 - 1;
    home[i * 3 + 1] = rand() * 2 - 1;
    home[i * 3 + 2] = rand() * 2 - 1;
    seed[i * 4] = rand();
    seed[i * 4 + 1] = rand();
    seed[i * 4 + 2] = rand();
    seed[i * 4 + 3] = 0.07 + Math.pow(rand(), 3) * 0.26;

    monoPos[i * 2] = mono.pts[i * 2];
    monoPos[i * 2 + 1] = mono.pts[i * 2 + 1];
    monoW[i] = rand() < (mobile ? 0.46 : 0.36) ? (mono.teal[i] ? 2 : 1) : 0;

    const s = slotOf[i];
    if (s >= 0) {
      line[i * 2] = page.pos[s * 2];
      line[i * 2 + 1] = page.pos[s * 2 + 1];
      lineW[i] = 1;
      delay[i] = page.delay[s];
      entity[i] = page.entity[s];
      glyph[i] = page.arabic[s] ? Math.floor(rand() * AR) : AR + Math.floor(rand() * LA);
    } else {
      line[i * 2] = rand() * 2 - 1;
      line[i * 2 + 1] = rand() * 2 - 1;
      glyph[i] = rand() < 0.6 ? Math.floor(rand() * AR) : AR + Math.floor(rand() * LA);
    }
  }

  const points = new THREE.BufferGeometry();
  points.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  points.setAttribute("aHome", new THREE.BufferAttribute(home, 3));
  points.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  points.setAttribute("aMono", new THREE.BufferAttribute(monoPos, 2));
  points.setAttribute("aMonoW", new THREE.BufferAttribute(monoW, 1));
  points.setAttribute("aLine", new THREE.BufferAttribute(line, 2));
  points.setAttribute("aLineW", new THREE.BufferAttribute(lineW, 1));
  points.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));
  points.setAttribute("aEntity", new THREE.BufferAttribute(entity, 1));
  points.setAttribute("aGlyph", new THREE.BufferAttribute(glyph, 1));

  // Graph links: each endpoint copies its glyph's attributes so the shader
  // computes the identical position and the edge stays attached.
  const edges = page.edges.filter(([a, b]) => a < slots && b < slots);
  const n = edges.length * 2;
  const lHome = new Float32Array(n * 3);
  const lSeed = new Float32Array(n * 4);
  const lMono = new Float32Array(n * 2);
  const lMonoW = new Float32Array(n);
  const lLine = new Float32Array(n * 2);
  const lLineW = new Float32Array(n);
  const lDelay = new Float32Array(n);
  const lEnd = new Float32Array(n);
  const lEdgeSeed = new Float32Array(n);
  edges.forEach(([sa, sb], e) => {
    const r = rand();
    [particleOfSlot[sa], particleOfSlot[sb]].forEach((p, k) => {
      const v = e * 2 + k;
      lHome.set(home.subarray(p * 3, p * 3 + 3), v * 3);
      lSeed.set(seed.subarray(p * 4, p * 4 + 4), v * 4);
      lMono.set(monoPos.subarray(p * 2, p * 2 + 2), v * 2);
      lMonoW[v] = monoW[p];
      lLine.set(line.subarray(p * 2, p * 2 + 2), v * 2);
      lLineW[v] = lineW[p];
      lDelay[v] = delay[p];
      lEnd[v] = k;
      lEdgeSeed[v] = r;
    });
  });
  const links = new THREE.BufferGeometry();
  links.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  links.setAttribute("aHome", new THREE.BufferAttribute(lHome, 3));
  links.setAttribute("aSeed", new THREE.BufferAttribute(lSeed, 4));
  links.setAttribute("aMono", new THREE.BufferAttribute(lMono, 2));
  links.setAttribute("aMonoW", new THREE.BufferAttribute(lMonoW, 1));
  links.setAttribute("aLine", new THREE.BufferAttribute(lLine, 2));
  links.setAttribute("aLineW", new THREE.BufferAttribute(lLineW, 1));
  links.setAttribute("aDelay", new THREE.BufferAttribute(lDelay, 1));
  links.setAttribute("aEnd", new THREE.BufferAttribute(lEnd, 1));
  links.setAttribute("aEdgeSeed", new THREE.BufferAttribute(lEdgeSeed, 1));

  return { points, links, slotW: page.slotW };
}

