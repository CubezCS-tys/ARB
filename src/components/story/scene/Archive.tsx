"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import type { StoryAssets } from "./assets";
import { mulberry32 } from "../graph";
import { T, seg, type StoryClock } from "../timeline";

/** Chapter I environment: page stacks, a slowly fanning book, a gold light shaft and dust. */

const shaftVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const shaftFrag = /* glsl */ `
uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;
void main() {
  float x = 1.0 - abs(vUv.x - 0.5) * 2.0;
  float a = pow(x, 2.2) * smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
  a *= 0.85 + 0.15 * sin(uTime * 0.6 + vUv.y * 5.0);
  a *= 0.13 * uOpacity;
  gl_FragColor = vec4(vec3(0.89, 0.78, 0.56) * a, a);
}`;

const dustVert = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime;
uniform float uPx;
uniform float uOpacity;
varying float vA;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.13 + aSeed.x * 6.28) * 0.25;
  p.y += mod(-uTime * 0.05 * (0.4 + aSeed.y) + aSeed.z * 4.0, 4.0) - 2.0;
  p.z += cos(uTime * 0.11 + aSeed.z * 6.28) * 0.2;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = (0.35 + 0.65 * sin(uTime * (0.5 + aSeed.x) + aSeed.y * 10.0) * 0.5 + 0.5) * uOpacity;
  gl_PointSize = (2.0 + aSeed.y * 5.0) * uPx * 6.0 / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const dustFrag = /* glsl */ `
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vA * 0.6;
  gl_FragColor = vec4(vec3(1.0, 0.88, 0.64) * a, a);
}`;

const FAN_PAGES = 16;

export default function Archive({
  assets,
  clock,
  pixelRatio,
  isMobile,
}: {
  assets: StoryAssets;
  clock: StoryClock;
  pixelRatio: number;
  isMobile: boolean;
}) {
  const root = useRef<Group>(null);
  const fan = useRef<InstancedMesh>(null);
  const stacks = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const stackLayout = useMemo(() => {
    const rnd = mulberry32(5);
    const piles: { at: [number, number, number]; n: number; rot: number }[] = [
      { at: [-3.5, -2.3, -2.2], n: 30, rot: 0.3 },
      { at: [-2.4, -2.4, -4.8], n: 22, rot: -0.2 },
      { at: [4.3, -2.5, -4.2], n: 26, rot: 0.5 },
    ];
    const items: { pos: [number, number, number]; rotY: number; color: Color }[] = [];
    for (const pile of piles) {
      for (let i = 0; i < pile.n; i++) {
        const shade = 0.22 + rnd() * 0.18 + (i / pile.n) * 0.12;
        items.push({
          pos: [pile.at[0] + (rnd() - 0.5) * 0.12, pile.at[1] + i * 0.045, pile.at[2] + (rnd() - 0.5) * 0.12],
          rotY: pile.rot + (rnd() - 0.5) * 0.12,
          color: new Color(shade * 1.05, shade * 0.8, shade * 0.5),
        });
      }
    }
    return items;
  }, []);

  const res = useMemo(() => {
    const fanGeo = new PlaneGeometry(1.4, 1.9, 10, 1);
    fanGeo.translate(0.7, 0, 0);
    const fp = fanGeo.attributes.position;
    for (let i = 0; i < fp.count; i++) fp.setZ(i, 0.12 * Math.sin((Math.PI * fp.getX(i)) / 1.4));
    const fanMat = new MeshBasicMaterial({
      map: assets.composite,
      color: new Color(0.55, 0.47, 0.36),
      side: DoubleSide,
      transparent: true,
    });
    const stackGeo = new BoxGeometry(1.5, 0.038, 2.0);
    const stackMat = new MeshBasicMaterial({ transparent: true });

    const shaftGeo = new PlaneGeometry(1.8, 9.5);
    const shaftMat = new ShaderMaterial({
      uniforms: { uOpacity: { value: 1 }, uTime: { value: 0 } },
      vertexShader: shaftVert,
      fragmentShader: shaftFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    const dustCount = isMobile ? 220 : 650;
    const rnd = mulberry32(9);
    const dp = new Float32Array(dustCount * 3);
    const ds = new Float32Array(dustCount * 3);
    const a = [-3.2, 5.2, -1.2];
    const b = [0.8, -2.6, 0.6];
    for (let i = 0; i < dustCount; i++) {
      const t = rnd();
      const spread = 0.35 + t * 0.55;
      dp[i * 3] = a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * spread * 2;
      dp[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * 0.6;
      dp[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + (rnd() - 0.5) * spread * 2;
      ds.set([rnd(), rnd(), rnd()], i * 3);
    }
    const dustGeo = new BufferGeometry();
    dustGeo.setAttribute("position", new BufferAttribute(dp, 3));
    dustGeo.setAttribute("aSeed", new BufferAttribute(ds, 3));
    const dustMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPx: { value: pixelRatio }, uOpacity: { value: 1 } },
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { fanGeo, fanMat, stackGeo, stackMat, shaftGeo, shaftMat, dustGeo, dustMat };
  }, [assets, isMobile, pixelRatio]);

  useEffect(
    () => () => {
      Object.values(res).forEach((r) => r.dispose());
    },
    [res],
  );

  useEffect(() => {
    const m = stacks.current;
    if (!m) return;
    stackLayout.forEach((s, i) => {
      dummy.position.set(...s.pos);
      dummy.rotation.set(0, s.rotY, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, s.color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [stackLayout, dummy, res]);

  useFrame(() => {
    const { p, t } = clock;
    const r = root.current;
    if (!r) return;
    const fade = 1 - seg(p, T.archiveOut[0], T.archiveOut[1]);
    r.visible = fade > 0.001;
    if (!r.visible) return;
    const shaftFade = 1 - seg(p, 0.3, 0.44);
    res.shaftMat.uniforms.uOpacity.value = shaftFade;
    res.shaftMat.uniforms.uTime.value = t;
    res.dustMat.uniforms.uOpacity.value = shaftFade;
    res.dustMat.uniforms.uTime.value = t;
    res.fanMat.opacity = fade;
    res.stackMat.opacity = fade;
    r.position.y = -seg(p, 0.36, 0.48) * 1.2;

    const m = fan.current;
    if (m) {
      for (let i = 0; i < FAN_PAGES; i++) {
        const w = 0.5 + 0.5 * Math.sin(t * 0.22 + p * 5 - i * 0.2);
        const angle = 0.06 + (Math.PI - 0.12) * (w * w * (3 - 2 * w));
        dummy.position.set(0, 0, i * 0.004);
        dummy.rotation.set(0, -angle, 0);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={root}>
      <group position={[3.0, -1.55, -2.4]} rotation={[-1.1, 0, 0.22]}>
        <instancedMesh ref={fan} args={[res.fanGeo, res.fanMat, FAN_PAGES]} frustumCulled={false} />
      </group>
      <instancedMesh ref={stacks} args={[res.stackGeo, res.stackMat, stackLayout.length]} />
      <mesh geometry={res.shaftGeo} material={res.shaftMat} position={[-1.2, 1.3, -0.4]} rotation={[0, 0, 0.47]} renderOrder={6} />
      <points geometry={res.dustGeo} material={res.dustMat} frustumCulled={false} renderOrder={7} />
    </group>
  );
}
