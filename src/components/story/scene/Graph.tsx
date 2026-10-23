"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import type { StoryGraph } from "../graph";
import { mulberry32 } from "../graph";
import { CARD_H, CARD_W, type StoryAssets } from "./assets";
import { T, lin, seg, mix, type StoryClock } from "../timeline";

/** Chapters IV and V: the citation graph, travelling pulses, the query beam and the cited source cards. */

const nodeVert = /* glsl */ `
attribute float aSize;
attribute float aDist;
attribute vec3 aColor;
uniform float uReveal;
uniform float uTime;
uniform float uPx;
uniform float uDim;
varying vec3 vColor;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float r = smoothstep(aDist, aDist + 0.06, uReveal * 1.06);
  float tw = 0.8 + 0.2 * sin(uTime * 1.3 + aDist * 47.0);
  vA = r * tw * (1.0 - uDim * 0.6);
  vColor = aColor;
  gl_PointSize = aSize * uPx * 70.0 * (0.4 + 0.6 * r) / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const nodeFrag = /* glsl */ `
varying vec3 vColor;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.0, d);
  float a = (pow(core, 3.0) * 1.2 + core * 0.25) * vA;
  if (a < 0.005) discard;
  gl_FragColor = vec4(vColor * a, a);
}`;

const edgeVert = /* glsl */ `
attribute float aDist;
uniform float uReveal;
uniform float uDim;
varying float vA;
void main() {
  float r = smoothstep(aDist, aDist + 0.05, uReveal * 1.06);
  vA = r * (1.0 - uDim * 0.65);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const edgeFrag = /* glsl */ `
varying float vA;
void main() {
  float a = vA * 0.42;
  gl_FragColor = vec4(vec3(0.8, 0.69, 0.49) * a, a);
}`;

const pulseVert = /* glsl */ `
attribute vec3 aB;
attribute vec3 aSeed;
uniform float uTime;
uniform float uReveal;
uniform float uPx;
uniform float uDim;
varying float vA;
varying float vTeal;
void main() {
  float t = fract(uTime * (0.12 + aSeed.y * 0.25) + aSeed.x);
  vec3 p = mix(position, aB, t);
  float r = smoothstep(aSeed.z, aSeed.z + 0.05, uReveal * 1.06);
  vA = sin(t * 3.14159) * r * (1.0 - uDim * 0.7);
  vTeal = step(0.4, fract(aSeed.x * 7.0));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uPx * 60.0 / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const pulseFrag = /* glsl */ `
varying float vA;
varying float vTeal;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, d), 2.0) * vA;
  vec3 c = mix(vec3(0.95, 0.83, 0.6), vec3(0.5, 0.86, 0.92), vTeal);
  gl_FragColor = vec4(c * a, a);
}`;

const glowVert = /* glsl */ `
attribute float aSize;
uniform float uPx;
uniform float uScale;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale * uPx * 34.0 / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const glowFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.0, d);
  float a = (pow(core, 6.0) * 1.6 + pow(core, 2.0) * 0.35) * uOpacity;
  gl_FragColor = vec4(uColor * a, a);
}`;

const pathVert = /* glsl */ `
attribute float aT;
varying float vT;
void main() {
  vT = aT;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const pathFrag = /* glsl */ `
uniform float uProg;
uniform float uOpacity;
varying float vT;
void main() {
  if (vT > uProg) discard;
  float head = exp(-(uProg - vT) * 18.0);
  float a = (0.55 + 1.6 * head) * uOpacity;
  gl_FragColor = vec4(vec3(0.49, 0.85, 0.9) * a, a);
}`;

const pathNodeVert = /* glsl */ `
attribute float aT;
attribute float aEnd;
uniform float uProg;
uniform float uPx;
uniform float uTime;
uniform float uOpacity;
varying float vA;
void main() {
  float lit = smoothstep(aT - 0.01, aT + 0.02, uProg);
  vA = lit * uOpacity;
  float s = mix(4.0, 9.0 + sin(uTime * 4.0) * 1.5, aEnd);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = s * uPx * 34.0 * lit / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const pathNodeFrag = /* glsl */ `
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.0, d);
  float a = (pow(core, 4.0) * 1.5 + core * 0.2) * vA;
  gl_FragColor = vec4(vec3(0.55, 0.9, 0.95) * a, a);
}`;

const ENTRY = new Vector3(0, 1.2, 9.5);
const ENTRY_T = 0.2;

type PathPoly = { pts: Vector3[]; ts: number[] };

export default function Graph({
  assets,
  graph,
  clock,
  pixelRatio,
  isMobile,
}: {
  assets: StoryAssets;
  graph: StoryGraph;
  clock: StoryClock;
  pixelRatio: number;
  isMobile: boolean;
}) {
  const root = useRef<Group>(null);
  const cards = useRef<(Mesh | null)[]>([]);
  const tmp = useMemo(
    () => ({ a: new Vector3(), b: new Vector3(), fwd: new Vector3(), right: new Vector3(), up: new Vector3(), target: new Vector3() }),
    [],
  );

  const res = useMemo(() => {
    const { positions, dist, sizes, colors, edges, edgeCount, paths, sources } = graph;
    const node = (i: number) => new Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);

    // nodes
    const nodeGeo = new BufferGeometry();
    nodeGeo.setAttribute("position", new BufferAttribute(positions, 3));
    nodeGeo.setAttribute("aSize", new BufferAttribute(sizes, 1));
    nodeGeo.setAttribute("aDist", new BufferAttribute(dist, 1));
    nodeGeo.setAttribute("aColor", new BufferAttribute(colors, 3));
    const nodeMat = new ShaderMaterial({
      uniforms: { uReveal: { value: 0 }, uTime: { value: 0 }, uPx: { value: pixelRatio }, uDim: { value: 0 } },
      vertexShader: nodeVert,
      fragmentShader: nodeFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    // edges
    const ep = new Float32Array(edgeCount * 6);
    const ed = new Float32Array(edgeCount * 2);
    for (let e = 0; e < edgeCount; e++) {
      const a = edges[e * 2];
      const b = edges[e * 2 + 1];
      ep.set(positions.subarray(a * 3, a * 3 + 3), e * 6);
      ep.set(positions.subarray(b * 3, b * 3 + 3), e * 6 + 3);
      const d = Math.max(dist[a], dist[b]);
      ed[e * 2] = d;
      ed[e * 2 + 1] = d;
    }
    const edgeGeo = new BufferGeometry();
    edgeGeo.setAttribute("position", new BufferAttribute(ep, 3));
    edgeGeo.setAttribute("aDist", new BufferAttribute(ed, 1));
    const edgeMat = new ShaderMaterial({
      uniforms: { uReveal: { value: 0 }, uDim: { value: 0 } },
      vertexShader: edgeVert,
      fragmentShader: edgeFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    // travelling pulses
    const rnd = mulberry32(21);
    const pc = isMobile ? 90 : 280;
    const pa = new Float32Array(pc * 3);
    const pb = new Float32Array(pc * 3);
    const ps = new Float32Array(pc * 3);
    for (let i = 0; i < pc; i++) {
      const e = Math.floor(rnd() * edgeCount);
      const flip = rnd() < 0.5;
      const a = edges[e * 2 + (flip ? 1 : 0)];
      const b = edges[e * 2 + (flip ? 0 : 1)];
      pa.set(positions.subarray(a * 3, a * 3 + 3), i * 3);
      pb.set(positions.subarray(b * 3, b * 3 + 3), i * 3);
      ps.set([rnd(), rnd(), Math.max(dist[a], dist[b])], i * 3);
    }
    const pulseGeo = new BufferGeometry();
    pulseGeo.setAttribute("position", new BufferAttribute(pa, 3));
    pulseGeo.setAttribute("aB", new BufferAttribute(pb, 3));
    pulseGeo.setAttribute("aSeed", new BufferAttribute(ps, 3));
    const pulseMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uPx: { value: pixelRatio }, uDim: { value: 0 } },
      vertexShader: pulseVert,
      fragmentShader: pulseFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    // centre document glow (two layers)
    const glowGeo = new BufferGeometry();
    glowGeo.setAttribute("position", new BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0]), 3));
    glowGeo.setAttribute("aSize", new BufferAttribute(new Float32Array([14, 40]), 1));
    const glowMat = new ShaderMaterial({
      uniforms: {
        uPx: { value: pixelRatio },
        uScale: { value: 1 },
        uOpacity: { value: 0 },
        uColor: { value: new Vector3(1.0, 0.9, 0.7) },
      },
      vertexShader: glowVert,
      fragmentShader: glowFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    // query beam paths: entry -> centre (t 0..ENTRY_T), then centre -> each source
    const polys: PathPoly[] = [];
    const segPos: number[] = [];
    const segT: number[] = [];
    const nodePos: number[] = [];
    const nodeT: number[] = [];
    const nodeEnd: number[] = [];
    const origin = node(0);
    segPos.push(ENTRY.x, ENTRY.y, ENTRY.z, origin.x, origin.y, origin.z);
    segT.push(0, ENTRY_T);
    polys.push({ pts: [ENTRY.clone(), origin.clone()], ts: [0, ENTRY_T] });
    nodePos.push(0, 0, 0);
    nodeT.push(ENTRY_T);
    nodeEnd.push(0);
    paths.forEach((chain) => {
      const pts = chain.map(node);
      let total = 0;
      for (let i = 1; i < pts.length; i++) total += pts[i].distanceTo(pts[i - 1]);
      total = Math.max(total, 1e-3);
      const ts = [ENTRY_T];
      let cum = 0;
      for (let i = 1; i < pts.length; i++) {
        cum += pts[i].distanceTo(pts[i - 1]);
        ts.push(ENTRY_T + ((1 - ENTRY_T) * cum) / total);
      }
      for (let i = 1; i < pts.length; i++) {
        segPos.push(pts[i - 1].x, pts[i - 1].y, pts[i - 1].z, pts[i].x, pts[i].y, pts[i].z);
        segT.push(ts[i - 1], ts[i]);
        nodePos.push(pts[i].x, pts[i].y, pts[i].z);
        nodeT.push(ts[i]);
        nodeEnd.push(i === pts.length - 1 ? 1 : 0);
      }
      polys.push({ pts, ts });
    });
    const pathGeo = new BufferGeometry();
    pathGeo.setAttribute("position", new BufferAttribute(new Float32Array(segPos), 3));
    pathGeo.setAttribute("aT", new BufferAttribute(new Float32Array(segT), 1));
    const pathMat = new ShaderMaterial({
      uniforms: { uProg: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: pathVert,
      fragmentShader: pathFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const pathNodeGeo = new BufferGeometry();
    pathNodeGeo.setAttribute("position", new BufferAttribute(new Float32Array(nodePos), 3));
    pathNodeGeo.setAttribute("aT", new BufferAttribute(new Float32Array(nodeT), 1));
    pathNodeGeo.setAttribute("aEnd", new BufferAttribute(new Float32Array(nodeEnd), 1));
    const pathNodeMat = new ShaderMaterial({
      uniforms: { uProg: { value: 0 }, uPx: { value: pixelRatio }, uTime: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: pathNodeVert,
      fragmentShader: pathNodeFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    // sparks riding the beam heads
    const sparkGeo = new BufferGeometry();
    sparkGeo.setAttribute("position", new BufferAttribute(new Float32Array(polys.length * 3), 3));
    sparkGeo.setAttribute("aSize", new BufferAttribute(new Float32Array(polys.map(() => 9)), 1));
    const sparkMat = new ShaderMaterial({
      uniforms: {
        uPx: { value: pixelRatio },
        uScale: { value: 1 },
        uOpacity: { value: 0 },
        uColor: { value: new Vector3(0.6, 0.95, 1.0) },
      },
      vertexShader: glowVert,
      fragmentShader: glowFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    // cited source cards
    const cardGeo = new PlaneGeometry(CARD_W, CARD_H);
    const cardMats = assets.cards.map(
      (map) => new MeshBasicMaterial({ map, transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: DoubleSide }),
    );
    const sourcePos = sources.map(node);

    return {
      nodeGeo, nodeMat, edgeGeo, edgeMat, pulseGeo, pulseMat, glowGeo, glowMat,
      pathGeo, pathMat, pathNodeGeo, pathNodeMat, sparkGeo, sparkMat, cardGeo, cardMats,
      polys, sourcePos,
    };
  }, [graph, assets, pixelRatio, isMobile]);

  useEffect(
    () => () => {
      [res.nodeGeo, res.nodeMat, res.edgeGeo, res.edgeMat, res.pulseGeo, res.pulseMat, res.glowGeo, res.glowMat,
        res.pathGeo, res.pathMat, res.pathNodeGeo, res.pathNodeMat, res.sparkGeo, res.sparkMat, res.cardGeo,
        ...res.cardMats].forEach((r) => r.dispose());
    },
    [res],
  );

  useFrame((state) => {
    const { p, t } = clock;
    const g = root.current;
    if (!g) return;
    const on = p > T.collapse[0] - 0.01;
    g.visible = on;
    cards.current.forEach((c) => c && (c.visible = on && p > T.cards[0] - 0.005));
    if (!on) return;

    const reveal = seg(p, T.reveal[0], T.reveal[1]);
    const dim = seg(p, T.beam[0] - 0.01, T.beam[0] + 0.02);
    g.rotation.set(0.12 * (1 - seg(p, 0.7, 0.845)), mix(-0.4, 0.28, seg(p, 0.6, 0.845)) + Math.sin(t * 0.07) * 0.02 * (1 - dim), 0);
    g.updateMatrixWorld();

    const u = res;
    u.nodeMat.uniforms.uReveal.value = reveal;
    u.nodeMat.uniforms.uTime.value = t;
    u.nodeMat.uniforms.uDim.value = dim;
    u.edgeMat.uniforms.uReveal.value = reveal;
    u.edgeMat.uniforms.uDim.value = dim;
    u.pulseMat.uniforms.uReveal.value = reveal;
    u.pulseMat.uniforms.uTime.value = t;
    u.pulseMat.uniforms.uDim.value = dim;

    const glowIn = seg(p, T.collapse[0] + 0.02, T.collapse[1] + 0.01);
    u.glowMat.uniforms.uOpacity.value = glowIn * (0.85 + 0.15 * Math.sin(t * 2.2));
    u.glowMat.uniforms.uScale.value = mix(0.5, 1, glowIn) * (1 + 0.6 * seg(p, T.reveal[0], T.reveal[1]));

    const prog = lin(p, T.beam[0], T.beam[1]);
    const beamOn = prog > 0 ? 1 : 0;
    u.pathMat.uniforms.uProg.value = prog;
    u.pathMat.uniforms.uOpacity.value = beamOn;
    u.pathNodeMat.uniforms.uProg.value = prog;
    u.pathNodeMat.uniforms.uTime.value = t;
    u.pathNodeMat.uniforms.uOpacity.value = beamOn;

    // sparks at the beam heads
    const sp = u.sparkGeo.attributes.position as BufferAttribute;
    u.polys.forEach((poly, k) => {
      const { pts, ts } = poly;
      let idx = pts.length - 1;
      for (let i = 1; i < ts.length; i++) {
        if (prog <= ts[i]) {
          idx = i;
          break;
        }
      }
      const t0 = ts[idx - 1] ?? 0;
      const t1 = ts[idx] ?? 1;
      const f = t1 > t0 ? Math.min(1, Math.max(0, (prog - t0) / (t1 - t0))) : 1;
      const a = pts[Math.max(0, idx - 1)];
      const b = pts[idx];
      tmp.a.copy(a).lerp(b, f);
      sp.setXYZ(k, tmp.a.x, tmp.a.y, tmp.a.z);
    });
    sp.needsUpdate = true;
    u.sparkMat.uniforms.uOpacity.value = prog > 0 && prog < 1 ? 1 : prog >= 1 ? 1 - lin(p, T.beam[1], T.beam[1] + 0.02) : 0;

    // cards fly from their source node to a row in front of the camera
    const cam = state.camera;
    cam.getWorldDirection(tmp.fwd);
    tmp.right.set(1, 0, 0).applyQuaternion(cam.quaternion);
    tmp.up.set(0, 1, 0).applyQuaternion(cam.quaternion);
    const aspect = state.size.width / Math.max(1, state.size.height);
    const column = isMobile || aspect < 0.9;
    res.sourcePos.forEach((src, k) => {
      const m = cards.current[k];
      if (!m) return;
      const fly = seg(p, T.cards[0] + k * 0.01, T.cards[1] + k * 0.006 - 0.02);
      const d = column ? 6.6 : 7.4;
      const ox = column ? 0 : (k - 1) * 2.3;
      const oy = column ? 0.62 - k * 0.48 : 0.75;
      tmp.target.copy(cam.position).addScaledVector(tmp.fwd, d).addScaledVector(tmp.right, ox).addScaledVector(tmp.up, oy);
      tmp.a.copy(src).applyMatrix4(g.matrixWorld);
      tmp.b.copy(tmp.a).lerp(tmp.target, fly);
      tmp.b.addScaledVector(tmp.up, Math.sin(fly * Math.PI) * 0.8);
      m.position.copy(tmp.b);
      m.quaternion.copy(cam.quaternion);
      m.scale.setScalar(mix(0.04, column ? 0.5 : 1, fly));
      res.cardMats[k].opacity = seg(fly, 0, 0.25);
    });
  });

  return (
    <>
      <group ref={root}>
        <lineSegments geometry={res.edgeGeo} material={res.edgeMat} frustumCulled={false} />
        <points geometry={res.nodeGeo} material={res.nodeMat} frustumCulled={false} />
        <points geometry={res.pulseGeo} material={res.pulseMat} frustumCulled={false} />
        <points geometry={res.glowGeo} material={res.glowMat} frustumCulled={false} renderOrder={9} />
        <lineSegments geometry={res.pathGeo} material={res.pathMat} frustumCulled={false} renderOrder={10} />
        <points geometry={res.pathNodeGeo} material={res.pathNodeMat} frustumCulled={false} renderOrder={11} />
        <points geometry={res.sparkGeo} material={res.sparkMat} frustumCulled={false} renderOrder={12} />
      </group>
      {res.cardMats.map((mat, k) => (
        <mesh
          key={k}
          ref={(el) => {
            cards.current[k] = el;
          }}
          geometry={res.cardGeo}
          material={mat}
          renderOrder={20}
          visible={false}
        />
      ))}
    </>
  );
}
