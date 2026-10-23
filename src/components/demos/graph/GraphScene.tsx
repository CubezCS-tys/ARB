"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { nodeRadius, type Graph } from "./data";
import type { Visual } from "./visual";

export type CameraCommand = { type: "zoomIn" | "zoomOut" | "left" | "right" | "up" | "down" | "reset"; n: number };

export interface GraphSceneProps {
  graph: Graph;
  /** latest layout positions; the scene eases towards them */
  positions: Float32Array;
  visual: Visual;
  focusId: number | null;
  active: boolean;
  reducedMotion: boolean;
  mobile: boolean;
  zoomEnabled: boolean;
  command: CameraCommand | null;
  onHover: (id: number | null, x: number, y: number) => void;
  onSelect: (id: number) => void;
}

const HOME_POS = new THREE.Vector3(0, 20, 118);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);

const glowVertex = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  uniform float uResY;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * projectionMatrix[1][1] * uResY * 0.5 / max(-mv.z, 0.1);
    gl_Position = projectionMatrix * mv;
  }
`;
const glowFragment = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = a * a;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

function makeGlowMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uResY: { value: 800 } },
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

const noRaycast = () => null;

function GraphObjects(props: GraphSceneProps) {
  const { graph, positions, visual, focusId, reducedMotion, mobile, command, onHover, onSelect } = props;
  const n = graph.papers.length;
  const m = graph.edges.length / 2;
  const pulseCount = reducedMotion ? 0 : mobile ? 40 : 90;
  const { camera, size, viewport } = useThree();
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;

  const radii = useMemo(() => Float32Array.from(graph.papers.map(nodeRadius)), [graph]);

  // ---- objects (created once per graph, disposed on unmount) ----
  const objs = useMemo(() => {
    const sphere = new THREE.IcosahedronGeometry(1, 2);
    const sphereMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.15 });
    const mesh = new THREE.InstancedMesh(sphere, sphereMat, n);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;

    const haloGeo = new THREE.BufferGeometry();
    haloGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    haloGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    haloGeo.setAttribute("size", new THREE.BufferAttribute(new Float32Array(n), 1));
    const haloMat = makeGlowMaterial();
    const halo = new THREE.Points(haloGeo, haloMat);
    halo.frustumCulled = false;
    halo.raycast = noRaycast;

    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(m * 6), 3));
    edgeGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(m * 6), 3));
    const edgeMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(edgeGeo, edgeMat);
    lines.frustumCulled = false;
    lines.raycast = noRaycast;

    const pulseGeo = new THREE.BufferGeometry();
    const pc = Math.max(pulseCount, 1);
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pc * 3), 3));
    pulseGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pc * 3), 3));
    pulseGeo.setAttribute("size", new THREE.BufferAttribute(new Float32Array(pc), 1));
    const pulseMat = makeGlowMaterial();
    const pulses = new THREE.Points(pulseGeo, pulseMat);
    pulses.frustumCulled = false;
    pulses.raycast = noRaycast;

    return { sphere, sphereMat, mesh, haloGeo, haloMat, halo, edgeGeo, edgeMat, lines, pulseGeo, pulseMat, pulses };
  }, [n, m, pulseCount]);

  useEffect(
    () => () => {
      objs.sphere.dispose();
      objs.sphereMat.dispose();
      objs.mesh.dispose();
      objs.haloGeo.dispose();
      objs.haloMat.dispose();
      objs.edgeGeo.dispose();
      objs.edgeMat.dispose();
      objs.pulseGeo.dispose();
      objs.pulseMat.dispose();
    },
    [objs]
  );

  // ---- animated state ----
  const disp = useRef<Float32Array>(positions.slice());
  const curColor = useRef<Float32Array>(visual.nodeColor.slice());
  const curScale = useRef<Float32Array>(new Float32Array(n));
  const curEdge = useRef<Float32Array>(visual.edgeColor.slice());
  const dirty = useRef(true);
  const visualRef = useRef(visual);
  const posRef = useRef(positions);
  visualRef.current = visual;
  posRef.current = positions;
  useEffect(() => {
    dirty.current = true;
  }, [visual, positions]);

  const pulseState = useRef<{ slot: Float32Array; t: Float32Array; speed: Float32Array }>({
    slot: new Float32Array(0),
    t: new Float32Array(0),
    speed: new Float32Array(0),
  });
  const lastPulseList = useRef<Uint32Array | null>(null);
  useEffect(() => {
    const k = pulseCount;
    const ps = { slot: new Float32Array(k), t: new Float32Array(k), speed: new Float32Array(k) };
    for (let i = 0; i < k; i++) {
      ps.slot[i] = 0;
      ps.t[i] = Math.random();
      ps.speed[i] = 0.3 + Math.random() * 0.5;
    }
    pulseState.current = ps;
    lastPulseList.current = null;
  }, [pulseCount]);

  // ---- camera flights ----
  const fly = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const startFlight = (target: THREE.Vector3, pos: THREE.Vector3) => {
    if (reducedMotion && controls) {
      controls.target.copy(target);
      camera.position.copy(pos);
      controls.update();
      fly.current = null;
    } else {
      fly.current = { pos, target };
    }
  };

  useEffect(() => {
    if (!controls) return;
    const cancel = () => (fly.current = null);
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
  }, [controls]);

  useEffect(() => {
    if (!controls) return;
    if (focusId === null) {
      startFlight(HOME_TARGET.clone(), HOME_POS.clone());
      return;
    }
    const p = posRef.current;
    const target = new THREE.Vector3(p[focusId * 3], p[focusId * 3 + 1], p[focusId * 3 + 2]);
    const dir = camera.position.clone().sub(controls.target).normalize();
    const pos = target.clone().addScaledVector(dir, mobile ? 34 : 28);
    startFlight(target, pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, controls]);

  useEffect(() => {
    if (!command || !controls) return;
    const target = controls.target.clone();
    const offset = camera.position.clone().sub(target);
    switch (command.type) {
      case "zoomIn":
        offset.multiplyScalar(0.72);
        break;
      case "zoomOut":
        offset.multiplyScalar(1.38);
        break;
      case "left":
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.4);
        break;
      case "right":
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.4);
        break;
      case "up":
      case "down": {
        const axis = new THREE.Vector3().crossVectors(offset, camera.up).normalize();
        const next = offset.clone().applyAxisAngle(axis, command.type === "up" ? 0.3 : -0.3);
        if (Math.abs(next.clone().normalize().y) < 0.95) offset.copy(next);
        break;
      }
      case "reset":
        startFlight(HOME_TARGET.clone(), HOME_POS.clone());
        return;
    }
    const len = offset.length();
    if (len < 8) offset.setLength(8);
    if (len > 200) offset.setLength(200);
    startFlight(target, target.clone().add(offset));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command]);

  const mat = useMemo(() => new THREE.Matrix4(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const v = visualRef.current;
    const target = posRef.current;
    const res = size.height * viewport.dpr;
    objs.haloMat.uniforms.uResY.value = res;
    objs.pulseMat.uniforms.uResY.value = res;

    // camera flight
    if (fly.current && controls) {
      const k = 1 - Math.exp(-dt * 3.2);
      controls.target.lerp(fly.current.target, k);
      camera.position.lerp(fly.current.pos, k);
      controls.update();
      if (camera.position.distanceTo(fly.current.pos) < 0.05 && controls.target.distanceTo(fly.current.target) < 0.05) {
        fly.current = null;
      }
    }

    if (dirty.current) {
      const kp = reducedMotion ? 1 : 1 - Math.exp(-dt * 4);
      const kc = reducedMotion ? 1 : 1 - Math.exp(-dt * 6);
      let delta = 0;
      const d = disp.current;
      for (let i = 0; i < d.length; i++) {
        const diff = target[i] - d[i];
        d[i] += diff * kp;
        delta = Math.max(delta, Math.abs(diff));
      }
      const cc = curColor.current;
      for (let i = 0; i < cc.length; i++) {
        const diff = v.nodeColor[i] - cc[i];
        cc[i] += diff * kc;
        delta = Math.max(delta, Math.abs(diff));
      }
      const cs = curScale.current;
      for (let i = 0; i < n; i++) {
        const diff = v.nodeScale[i] - cs[i];
        cs[i] += diff * kc;
        delta = Math.max(delta, Math.abs(diff));
      }
      const ce = curEdge.current;
      for (let i = 0; i < ce.length; i++) {
        const diff = v.edgeColor[i] - ce[i];
        ce[i] += diff * kc;
        delta = Math.max(delta, Math.abs(diff));
      }

      const hp = objs.haloGeo.attributes.position.array as Float32Array;
      const hc = objs.haloGeo.attributes.color.array as Float32Array;
      const hs = objs.haloGeo.attributes.size.array as Float32Array;
      const ic = objs.mesh.instanceColor!.array as Float32Array;
      for (let i = 0; i < n; i++) {
        const s = cs[i] * radii[i];
        mat.makeScale(s, s, s).setPosition(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]);
        objs.mesh.setMatrixAt(i, mat);
        hp[i * 3] = d[i * 3];
        hp[i * 3 + 1] = d[i * 3 + 1];
        hp[i * 3 + 2] = d[i * 3 + 2];
        hs[i] = s * 5.5;
        for (let k = 0; k < 3; k++) {
          ic[i * 3 + k] = cc[i * 3 + k];
          hc[i * 3 + k] = cc[i * 3 + k] * 0.55;
        }
      }
      objs.mesh.instanceMatrix.needsUpdate = true;
      objs.mesh.instanceColor!.needsUpdate = true;
      objs.haloGeo.attributes.position.needsUpdate = true;
      objs.haloGeo.attributes.color.needsUpdate = true;
      objs.haloGeo.attributes.size.needsUpdate = true;

      const ep = objs.edgeGeo.attributes.position.array as Float32Array;
      const ec = objs.edgeGeo.attributes.color.array as Float32Array;
      const edges = graph.edges;
      for (let e = 0; e < m; e++) {
        const a = edges[e * 2] * 3;
        const b = edges[e * 2 + 1] * 3;
        ep[e * 6] = d[a];
        ep[e * 6 + 1] = d[a + 1];
        ep[e * 6 + 2] = d[a + 2];
        ep[e * 6 + 3] = d[b];
        ep[e * 6 + 4] = d[b + 1];
        ep[e * 6 + 5] = d[b + 2];
      }
      ec.set(ce);
      objs.edgeGeo.attributes.position.needsUpdate = true;
      objs.edgeGeo.attributes.color.needsUpdate = true;

      if (delta < 0.002) dirty.current = false;
    }

    // travelling pulses: knowledge flows from cited (older) to citing (newer)
    if (pulseCount > 0) {
      const ps = pulseState.current;
      const pp = objs.pulseGeo.attributes.position.array as Float32Array;
      const pc = objs.pulseGeo.attributes.color.array as Float32Array;
      const psz = objs.pulseGeo.attributes.size.array as Float32Array;
      const list = v.pulseEdges;
      const d = disp.current;
      if (lastPulseList.current !== list) {
        // edge set changed (focus, search, timeline): re-seat pulses on the new set,
        // starting from t=0 where they are invisible so nothing visibly jumps
        lastPulseList.current = list;
        for (let i = 0; i < ps.t.length; i++) {
          ps.slot[i] = Math.floor(Math.random() * Math.max(list.length, 1));
          ps.t[i] = Math.random() * 0.15;
        }
      }
      for (let i = 0; i < ps.t.length; i++) {
        if (!list.length) {
          psz[i] = 0;
          continue;
        }
        ps.t[i] += dt * ps.speed[i];
        if (ps.t[i] >= 1 || ps.slot[i] >= list.length) {
          ps.t[i] = 0;
          ps.slot[i] = Math.floor(Math.random() * list.length);
        }
        const slot = ps.slot[i];
        const e = list[slot];
        const a = graph.edges[e * 2] * 3;
        const b = graph.edges[e * 2 + 1] * 3;
        const t = ps.t[i];
        pp[i * 3] = d[a] + (d[b] - d[a]) * t;
        pp[i * 3 + 1] = d[a + 1] + (d[b + 1] - d[a + 1]) * t;
        pp[i * 3 + 2] = d[a + 2] + (d[b + 2] - d[a + 2]) * t;
        const f = Math.sin(Math.PI * t);
        pc[i * 3] = v.pulseColor[slot * 3] * f;
        pc[i * 3 + 1] = v.pulseColor[slot * 3 + 1] * f;
        pc[i * 3 + 2] = v.pulseColor[slot * 3 + 2] * f;
        psz[i] = 1.6 + f * 1.2;
      }
      objs.pulseGeo.attributes.position.needsUpdate = true;
      objs.pulseGeo.attributes.color.needsUpdate = true;
      objs.pulseGeo.attributes.size.needsUpdate = true;
    }
  });

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    onHover(e.instanceId, e.nativeEvent.clientX, e.nativeEvent.clientY);
    document.body.style.cursor = "pointer";
  };
  const handleOut = () => {
    onHover(null, 0, 0);
    document.body.style.cursor = "";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6 || e.instanceId === undefined) return;
    onSelect(e.instanceId);
  };

  useEffect(() => () => void (document.body.style.cursor = ""), []);

  return (
    <>
      <primitive object={objs.lines} />
      <primitive object={objs.halo} />
      <primitive object={objs.mesh} onPointerMove={handleMove} onPointerOut={handleOut} onClick={handleClick} />
      {pulseCount > 0 && <primitive object={objs.pulses} />}
    </>
  );
}

export default function GraphScene(props: GraphSceneProps) {
  const { active, mobile, reducedMotion, focusId, zoomEnabled } = props;
  return (
    <Canvas
      flat
      dpr={[1, mobile ? 1.5 : 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ position: HOME_POS.toArray(), fov: 45, near: 0.5, far: 500 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
    >
      <fog attach="fog" args={["#060B18", 90, 240]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[30, 40, 25]} intensity={2.2} color="#F7F1E4" />
      <directionalLight position={[-40, -20, -30]} intensity={0.8} color="#7CC4CF" />
      <GraphObjects {...props} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        enableZoom={zoomEnabled}
        minDistance={8}
        maxDistance={200}
        rotateSpeed={mobile ? 0.6 : 0.8}
        autoRotate={!reducedMotion && focusId === null}
        autoRotateSpeed={0.35}
      />
    </Canvas>
  );
}
