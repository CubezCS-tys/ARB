"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Billboard, Html } from "@react-three/drei";
import { easing } from "maath";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { brand, divisions } from "@/content/site";

export type DivisionId = (typeof divisions)[number]["id"];

type Props = {
  focused: DivisionId | null;
  hovered: DivisionId | null;
  onHover: (id: DivisionId | null) => void;
  onSelect: (id: DivisionId) => void;
  /** render loop runs only while the canvas is on screen */
  active: boolean;
  compact: boolean;
};

const ORBITS: Record<DivisionId, { radius: number; speed: number; phase: number; tilt: number; size: number; color: string; glow: string }> = {
  advisory: { radius: 2.5, speed: 0.3, phase: 0.6, tilt: 0.06, size: 0.24, color: "#CBAF7E", glow: "#E3CFA6" },
  labs: { radius: 3.65, speed: 0.2, phase: 2.7, tilt: -0.09, size: 0.3, color: "#7FE3C9", glow: "#4C9DAB" },
  research: { radius: 4.85, speed: 0.13, phase: 4.6, tilt: 0.12, size: 0.27, color: "#F7F8FA", glow: "#E3CFA6" },
};

const WELL_RADIUS = 8;

/* ---------------------------------------------------------------- */
/* shared resources                                                   */
/* ---------------------------------------------------------------- */

function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.45)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.08)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The SI monogram (same construction as components/brand/Logo.tsx) drawn to a texture. */
function makeMonogramTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, size, size);
    const k = size / 64;
    const grad = g.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#FFF3DA");
    grad.addColorStop(0.55, "#E3CFA6");
    grad.addColorStop(1, "#CBAF7E");
    g.fillStyle = grad;
    const family = getComputedStyle(document.body).getPropertyValue("--font-playfair").trim() || "Georgia";
    g.font = `600 ${60 * k}px ${family}, Georgia, serif`;
    g.textBaseline = "alphabetic";
    g.fillText("S", 4 * k, 54 * k);
    g.fillRect(45 * k, 24 * k, 7.5 * k, 30 * k);
    g.fillStyle = "#7CC4CF";
    g.beginPath();
    g.moveTo(44 * k, 20 * k);
    g.lineTo(58 * k, 6 * k);
    g.lineTo(56 * k, 20 * k);
    g.closePath();
    g.fill();
    tex.needsUpdate = true;
  };
  draw();
  // redraw once webfonts are ready so the S is Playfair, not the fallback
  document.fonts?.ready.then(draw).catch(() => undefined);
  return tex;
}

const coreVertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const coreFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCore;
  uniform vec3 uRim;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.0);
    float pulse = 0.92 + 0.08 * sin(uTime * 1.2);
    vec3 col = mix(uCore, uRim, f) * pulse + uRim * f * 0.9;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ---------------------------------------------------------------- */
/* ARB: the gravity well the whole system sits in                     */
/* ---------------------------------------------------------------- */

function wellDepth(r: number) {
  return -3 / (r + 1.1) + 3 / (WELL_RADIUS + 1.1);
}

function GravityWell({ compact }: { compact: boolean }) {
  const geometry = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const base = new THREE.Color("#8C7650");
    const push = (r: number, a: number) => {
      pos.push(Math.cos(a) * r, wellDepth(r), Math.sin(a) * r);
      const fade = Math.pow(1 - r / (WELL_RADIUS * 1.02), 1.3) * 0.9 + 0.05;
      col.push(base.r * fade, base.g * fade, base.b * fade);
    };
    const rings = compact ? 10 : 16;
    const seg = compact ? 72 : 120;
    for (let i = 0; i < rings; i++) {
      const r = 0.9 + (i / (rings - 1)) * (WELL_RADIUS - 0.9);
      for (let s = 0; s < seg; s++) {
        push(r, (s / seg) * Math.PI * 2);
        push(r, ((s + 1) / seg) * Math.PI * 2);
      }
    }
    const spokes = compact ? 24 : 40;
    const steps = 28;
    for (let s = 0; s < spokes; s++) {
      const a = (s / spokes) * Math.PI * 2;
      for (let j = 0; j < steps; j++) {
        const r0 = 0.9 + (j / steps) * (WELL_RADIUS - 0.9);
        const r1 = 0.9 + ((j + 1) / steps) * (WELL_RADIUS - 0.9);
        push(r0, a);
        push(r1, a);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [compact]);

  const rim = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * WELL_RADIUS, 0, Math.sin(a) * WELL_RADIUS));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => rim.dispose(), [rim]);

  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.012;
  });

  return (
    <group position={[0, -0.9, 0]}>
      <group ref={ref}>
        <lineSegments geometry={geometry}>
          <lineBasicMaterial vertexColors transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
        </lineSegments>
      </group>
      <lineLoop geometry={rim}>
        <lineBasicMaterial color="#CBAF7E" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineLoop>
      <Html position={[0, 0.15, WELL_RADIUS]} center zIndexRange={[5, 0]} className="pointer-events-none select-none">
        <span aria-hidden className="block whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.28em] text-gold/70">
          {brand.parent} · parent
        </span>
      </Html>
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* SI: luminous core with the monogram                                */
/* ---------------------------------------------------------------- */

function Core({ glow }: { glow: THREE.Texture }) {
  const monogram = useMemo(() => makeMonogramTexture(), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: coreVertex,
        fragmentShader: coreFragment,
        uniforms: {
          uTime: { value: 0 },
          uCore: { value: new THREE.Color("#3A2E1C") },
          uRim: { value: new THREE.Color("#E3CFA6") },
        },
      }),
    [],
  );
  useEffect(
    () => () => {
      monogram.dispose();
      material.dispose();
    },
    [monogram, material],
  );

  const ring = useRef<THREE.Mesh>(null);
  useFrame((state, dt) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    if (ring.current) ring.current.rotation.z += dt * 0.25;
  });

  return (
    <group>
      <mesh material={material}>
        <sphereGeometry args={[0.78, 64, 64]} />
      </mesh>
      <sprite scale={[5.2, 5.2, 1]}>
        <spriteMaterial map={glow} color="#CBAF7E" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <mesh ref={ring} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.08, 0.006, 8, 160]} />
        <meshBasicMaterial color="#E3CFA6" transparent opacity={0.7} />
      </mesh>
      <Billboard>
        {/* sits just in front of the sphere surface so passing planets still occlude it */}
        <mesh position={[0, 0, 0.8]}>
          <planeGeometry args={[0.95, 0.95]} />
          <meshBasicMaterial map={monogram} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </Billboard>
      <pointLight color="#E3CFA6" intensity={28} distance={14} decay={2} />
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Divisions: planets with orbit lines and fading trails              */
/* ---------------------------------------------------------------- */

type PlanetHandle = { angle: number; mesh: THREE.Object3D | null };

function Planet({
  id,
  glow,
  handle,
  emphasis,
  onHover,
  onSelect,
}: {
  id: DivisionId;
  glow: THREE.Texture;
  handle: PlanetHandle;
  emphasis: boolean;
  onHover: Props["onHover"];
  onSelect: Props["onSelect"];
}) {
  const o = ORBITS[id];
  const name = divisions.find((d) => d.id === id)!.name;
  const orbitGroup = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const glowMat = useRef<THREE.SpriteMaterial>(null);

  const { orbit, trail } = useMemo(() => {
    const ring: THREE.Vector3[] = [];
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2;
      ring.push(new THREE.Vector3(Math.cos(a) * o.radius, 0, -Math.sin(a) * o.radius));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(ring);

    // trail sits behind the planet in the rotating frame: angles -1.3 .. 0
    const n = 64;
    const pos: number[] = [];
    const col: number[] = [];
    const c = new THREE.Color(o.glow);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const a = -1.3 * (1 - t);
      pos.push(Math.cos(a) * o.radius, 0, -Math.sin(a) * o.radius);
      const f = t * t;
      col.push(c.r * f, c.g * f, c.b * f);
    }
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    trailGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const trailMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { orbit: orbitGeo, trail: new THREE.Line(trailGeo, trailMat) };
  }, [o.radius, o.glow]);

  useEffect(
    () => () => {
      orbit.dispose();
      trail.geometry.dispose();
      (trail.material as THREE.Material).dispose();
    },
    [orbit, trail],
  );

  useFrame((_, dt) => {
    if (orbitGroup.current) orbitGroup.current.rotation.y = handle.angle;
    if (body.current) {
      const s = emphasis ? 1.45 : 1;
      easing.damp3(body.current.scale, [s, s, s], 0.25, dt);
      body.current.rotation.y += dt * 0.4;
    }
    if (glowMat.current) easing.damp(glowMat.current, "opacity", emphasis ? 0.95 : 0.5, 0.3, dt);
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(id);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    onHover(null);
    document.body.style.cursor = "";
  };

  return (
    <group rotation={[o.tilt, 0, 0]}>
      <lineLoop geometry={orbit}>
        <lineBasicMaterial color={o.glow} transparent opacity={emphasis ? 0.35 : 0.14} depthWrite={false} />
      </lineLoop>
      <group ref={orbitGroup}>
        <primitive object={trail} />
        <group position={[o.radius, 0, 0]}>
          <group ref={(m) => void (handle.mesh = m)}>
            <group ref={body}>
              <mesh>
                <sphereGeometry args={[o.size, 40, 40]} />
                <meshStandardMaterial color={o.color} emissive={o.glow} emissiveIntensity={0.35} roughness={0.45} metalness={0.15} />
              </mesh>
              <sprite scale={[o.size * 7, o.size * 7, 1]}>
                <spriteMaterial
                  ref={glowMat}
                  map={glow}
                  color={o.glow}
                  transparent
                  opacity={0.5}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </sprite>
            </group>
            {/* generous invisible hit target */}
            <mesh
              visible={false}
              onPointerOver={over}
              onPointerOut={out}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(id);
              }}
            >
              <sphereGeometry args={[0.7, 12, 12]} />
            </mesh>
            <Html position={[0, o.size + 0.45, 0]} center zIndexRange={[6, 0]} className="pointer-events-none select-none">
              <span
                aria-hidden
                className={`block whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.24em] transition-colors duration-500 ${
                  emphasis ? "text-gold-light" : "text-mist/80"
                }`}
              >
                {name}
              </span>
            </Html>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Background stars                                                    */
/* ---------------------------------------------------------------- */

function Stars({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 16 + Math.random() * 22;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.6 + 2;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#9AA7BD" size={0.07} sizeAttenuation transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}

/* ---------------------------------------------------------------- */
/* System + camera rig                                                */
/* ---------------------------------------------------------------- */

const IDS = divisions.map((d) => d.id) as DivisionId[];

function System({ focused, hovered, onHover, onSelect, compact }: Omit<Props, "active">) {
  const glow = useMemo(() => makeGlowTexture(), []);
  useEffect(() => () => glow.dispose(), [glow]);

  const handles = useMemo(
    () => Object.fromEntries(IDS.map((id) => [id, { angle: ORBITS[id].phase, mesh: null }])) as Record<DivisionId, PlanetHandle>,
    [],
  );
  const timeScale = useRef(1);
  const look = useRef(new THREE.Vector3());
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();

  const home = compact ? new THREE.Vector3(0, 6.5, 15.5) : new THREE.Vector3(0, 4.4, 12.5);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    timeScale.current = THREE.MathUtils.damp(timeScale.current, focused ? 0.08 : hovered ? 0.35 : 1, 3, d);
    for (const id of IDS) handles[id].angle += d * ORBITS[id].speed * timeScale.current;

    const target = focused ? handles[focused].mesh : null;
    if (target) {
      target.getWorldPosition(tmp);
      // stand just outside the planet, looking back in toward the core
      const out = desired.set(tmp.x, 0, tmp.z).normalize();
      desired.set(tmp.x + out.x * 2.6, tmp.y + 1.1, tmp.z + out.z * 2.6);
      easing.damp3(camera.position, desired, 0.45, d);
      easing.damp3(look.current, tmp, 0.35, d);
    } else {
      desired.set(home.x + state.pointer.x * 1.2, home.y + state.pointer.y * 0.6, home.z);
      easing.damp3(camera.position, desired, 0.6, d);
      easing.damp3(look.current, [0, -0.2, 0], 0.5, d);
    }
    camera.lookAt(look.current);
  });

  return (
    <>
      <ambientLight intensity={0.18} />
      <Stars count={compact ? 220 : 600} />
      <GravityWell compact={compact} />
      <Core glow={glow} />
      {IDS.map((id) => (
        <Planet
          key={id}
          id={id}
          glow={glow}
          handle={handles[id]}
          emphasis={focused === id || hovered === id}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export default function OrbitalScene({ active, ...props }: Props) {
  useEffect(() => () => void (document.body.style.cursor = ""), []);
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 4.4, 12.5], fov: props.compact ? 42 : 36, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={() => props.onHover(null)}
      aria-hidden
    >
      <System {...props} />
    </Canvas>
  );
}
