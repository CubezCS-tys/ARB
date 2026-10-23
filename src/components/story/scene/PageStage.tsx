"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import { PAGE_H, PAGE_W, type StoryAssets } from "./assets";
import { T, lin, seg, mix, type StoryClock } from "../timeline";

/** Chapters I and II: the manuscript page, the scanline, the lifting ink and the OCR layer. */

const CRISP_Z = 0.55;
const CRISP_SCALE = 0.96;
const LIFT_RATE = 6.0; // how many page-heights of scan it takes a row to lift fully (inverse)

const pageVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const pageFrag = /* glsl */ `
uniform sampler2D uParch;
uniform sampler2D uInk;
uniform float uScan;
uniform float uOpacity;
uniform vec3 uTeal;
varying vec2 vUv;
void main() {
  vec3 parch = texture2D(uParch, vUv).rgb;
  vec4 ink = texture2D(uInk, vUv);
  float ny = 1.0 - vUv.y;
  float lifted = clamp((uScan - ny) * ${LIFT_RATE.toFixed(1)} - 0.15, 0.0, 1.0);
  vec3 col = mix(parch, ink.rgb, ink.a * (1.0 - 0.8 * lifted));
  vec2 lp = vec2(0.22, 0.88);
  vec2 dv = vUv - lp;
  float light = 0.32 + 0.46 * exp(-dot(dv, dv) * 2.4);
  col *= light;
  col = mix(col, col * vec3(0.82, 0.92, 1.0), lifted * 0.35);
  float scanOn = step(0.001, uScan) * (1.0 - step(1.0, uScan));
  float band = exp(-abs(ny - uScan) * 55.0) * scanOn;
  col += uTeal * band * 0.5;
  gl_FragColor = vec4(col, uOpacity);
}`;

const crispFrag = /* glsl */ `
uniform sampler2D uMap;
uniform float uScan;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec4 t = texture2D(uMap, vUv);
  float ny = 1.0 - vUv.y;
  float reveal = smoothstep(0.8, 1.4, (uScan - ny) * ${LIFT_RATE.toFixed(1)});
  gl_FragColor = vec4(t.rgb * 1.05, t.a * reveal * uOpacity);
}`;

const particleVert = /* glsl */ `
attribute vec3 aEnd;
attribute vec3 aRand;
attribute float aNy;
uniform float uScan;
uniform float uTime;
uniform float uPx;
uniform float uSize;
uniform float uOpacity;
varying float vLift;
varying float vA;
void main() {
  float lift = clamp((uScan - aNy) * ${LIFT_RATE.toFixed(1)} - aRand.x * 0.35, 0.0, 1.0);
  float e = lift * lift * (3.0 - 2.0 * lift);
  vec3 p = mix(position, aEnd, e);
  float arc = sin(e * 3.14159);
  p += arc * vec3(aRand.y * 0.28, aRand.z * 0.18 + 0.1, 0.3 + aRand.x * 0.35);
  p.xy += arc * 0.025 * vec2(sin(uTime * 3.0 + aRand.y * 30.0), cos(uTime * 2.4 + aRand.z * 30.0));
  vLift = e;
  vA = smoothstep(0.0, 0.06, lift) * (1.0 - smoothstep(0.78, 1.0, lift)) * uOpacity;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * uPx * (1.0 + arc * 0.9) / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const particleFrag = /* glsl */ `
varying float vLift;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vA;
  if (a < 0.01) discard;
  vec3 col = mix(vec3(0.86, 0.66, 0.38), vec3(0.55, 0.85, 0.9), vLift);
  gl_FragColor = vec4(col * 1.25, a);
}`;

const glowFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float y = abs(vUv.y - 0.5) * 2.0;
  float x = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 4.0);
  float a = pow(1.0 - y, 3.0) * x * uOpacity;
  gl_FragColor = vec4(uColor * a, a);
}`;

export default function PageStage({
  assets,
  clock,
  pixelRatio,
}: {
  assets: StoryAssets;
  clock: StoryClock;
  pixelRatio: number;
}) {
  const group = useRef<Group>(null);
  const page = useRef<Mesh>(null);
  const scanLine = useRef<Mesh>(null);
  const scanGlow = useRef<Mesh>(null);

  const res = useMemo(() => {
    const pageGeo = new PlaneGeometry(PAGE_W, PAGE_H, 24, 32);
    const pos = pageGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, -0.07 * (x / (PAGE_W / 2)) ** 2 + 0.015 * Math.sin(y * 1.4));
    }
    pageGeo.computeVertexNormals();

    const pageMat = new ShaderMaterial({
      uniforms: {
        uParch: { value: assets.parch },
        uInk: { value: assets.ink },
        uScan: { value: 0 },
        uOpacity: { value: 1 },
        uTeal: { value: new Color("#4C9DAB") },
      },
      vertexShader: pageVert,
      fragmentShader: pageFrag,
      transparent: true,
    });

    const crispGeo = new PlaneGeometry(PAGE_W, PAGE_H);
    const crispMat = new ShaderMaterial({
      uniforms: { uMap: { value: assets.crisp }, uScan: { value: 0 }, uOpacity: { value: 1 } },
      vertexShader: pageVert,
      fragmentShader: crispFrag,
      transparent: true,
      depthWrite: false,
    });

    // Glyph particles: ink sample -> OCR text sample, paired top-to-bottom.
    const n = assets.inkSamples.length / 2;
    const start = new Float32Array(n * 3);
    const end = new Float32Array(n * 3);
    const rand = new Float32Array(n * 3);
    const ny = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = assets.inkSamples[i * 2];
      const v = assets.inkSamples[i * 2 + 1];
      start[i * 3] = (u - 0.5) * PAGE_W;
      start[i * 3 + 1] = (0.5 - v) * PAGE_H;
      start[i * 3 + 2] = 0.02;
      ny[i] = v;
      const cu = assets.crispSamples[i * 2];
      const cv = assets.crispSamples[i * 2 + 1];
      end[i * 3] = (cu - 0.5) * PAGE_W * CRISP_SCALE;
      end[i * 3 + 1] = (0.5 - cv) * PAGE_H * CRISP_SCALE;
      end[i * 3 + 2] = CRISP_Z;
      rand[i * 3] = Math.random();
      rand[i * 3 + 1] = Math.random() - 0.5;
      rand[i * 3 + 2] = Math.random() - 0.5;
    }
    const partGeo = new BufferGeometry();
    partGeo.setAttribute("position", new BufferAttribute(start, 3));
    partGeo.setAttribute("aEnd", new BufferAttribute(end, 3));
    partGeo.setAttribute("aRand", new BufferAttribute(rand, 3));
    partGeo.setAttribute("aNy", new BufferAttribute(ny, 1));
    const partMat = new ShaderMaterial({
      uniforms: {
        uScan: { value: 0 },
        uTime: { value: 0 },
        uPx: { value: pixelRatio },
        uSize: { value: 9 },
        uOpacity: { value: 1 },
      },
      vertexShader: particleVert,
      fragmentShader: particleFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    const lineGeo = new PlaneGeometry(PAGE_W * 1.12, 0.014);
    const lineMat = new MeshBasicMaterial({
      color: new Color(0.62, 0.92, 0.97),
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const glowGeo = new PlaneGeometry(PAGE_W * 1.2, 0.7);
    const glowMat = new ShaderMaterial({
      uniforms: { uColor: { value: new Color("#4C9DAB") }, uOpacity: { value: 0 } },
      vertexShader: pageVert,
      fragmentShader: glowFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });

    return { pageGeo, pageMat, crispGeo, crispMat, partGeo, partMat, lineGeo, lineMat, glowGeo, glowMat };
  }, [assets, pixelRatio]);

  useEffect(
    () => () => {
      Object.values(res).forEach((r) => r.dispose());
    },
    [res],
  );

  useFrame(() => {
    const { p, t } = clock;
    const g = group.current;
    if (!g) return;
    g.visible = p < 0.5;
    if (!g.visible) return;

    const settle = seg(p, 0.02, 0.22);
    g.rotation.set(mix(-0.12, 0, settle), mix(0.34, 0, settle) + Math.sin(t * 0.3) * 0.012 * (1 - settle), mix(0.03, 0, settle));
    g.position.set(0, Math.sin(t * 0.5) * 0.03 * (1 - settle), 0);

    const scan = lin(p, T.scan[0], T.scan[1]) * 1.3;
    const out = seg(p, T.pageOut[0], T.pageOut[1]);
    res.pageMat.uniforms.uScan.value = scan;
    res.pageMat.uniforms.uOpacity.value = 1 - out;
    if (page.current) {
      page.current.position.set(0, -out * 0.6, -out * 2.6);
      page.current.visible = out < 0.999;
    }
    res.crispMat.uniforms.uScan.value = scan;
    res.crispMat.uniforms.uOpacity.value = 1 - seg(p, T.crispOut[0], T.crispOut[1]);
    res.partMat.uniforms.uScan.value = scan;
    res.partMat.uniforms.uTime.value = t;
    res.partMat.uniforms.uOpacity.value = 1 - seg(p, 0.37, 0.4);

    const scanVis = seg(p, T.scan[0] - 0.006, T.scan[0] + 0.006) * (1 - seg(scan, 0.95, 1.0));
    const y = PAGE_H / 2 - PAGE_H * Math.min(1, scan);
    res.lineMat.opacity = scanVis;
    res.glowMat.uniforms.uOpacity.value = scanVis * 0.75;
    if (scanLine.current) scanLine.current.position.set(0, y, 0.06);
    if (scanGlow.current) scanGlow.current.position.set(0, y, 0.05);
  });

  return (
    <group ref={group}>
      <mesh ref={page} geometry={res.pageGeo} material={res.pageMat} />
      <mesh geometry={res.crispGeo} material={res.crispMat} position={[0, 0, CRISP_Z]} scale={CRISP_SCALE} renderOrder={2} />
      <points geometry={res.partGeo} material={res.partMat} frustumCulled={false} renderOrder={3} />
      <mesh ref={scanGlow} geometry={res.glowGeo} material={res.glowMat} renderOrder={4} />
      <mesh ref={scanLine} geometry={res.lineGeo} material={res.lineMat} renderOrder={5} />
    </group>
  );
}
