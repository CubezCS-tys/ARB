"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "gsap";
import { heroState } from "./heroState";
import { buildGlyphAtlas, cssFontFamily, waitForFonts } from "./glyphAtlas";
import { CAM_Z, TAN, buildField, layoutFor, type Built } from "./field";
import {
  linksFragment,
  linksVertex,
  pointsFragment,
  pointsVertex,
  ringFragment,
  ringVertex,
} from "./shaders";

type Props = {
  mobile: boolean;
  reduced: boolean;
  introDone: boolean;
  onReady: () => void;
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export default function GlyphField({ mobile, reduced, introDone, onReady }: Props) {
  const { size, invalidate } = useThree();
  const [built, setBuilt] = useState<Built | null>(null);
  const form = useRef({ value: reduced ? 1 : 0 });
  const mouse = useRef({ x: 0, y: 0, rx: 0, ry: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: reduced ? 14 : 0 },
      uForm: { value: 0 },
      uScroll: { value: 0 },
      uReveal: { value: 0 },
      uHalf: { value: new THREE.Vector2(1, 1) },
      uMonoCenter: { value: new THREE.Vector2() },
      uMonoScale: { value: 1 },
      uLineExtent: { value: new THREE.Vector2(1, 1) },
      uLineOffset: { value: new THREE.Vector2() },
      uLineGlyph: { value: 0.15 },
      uPixelScale: { value: 500 },
      uLens: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uAspect: { value: 1 },
      uGold: { value: new THREE.Color("#CBAF7E") },
      uGoldLight: { value: new THREE.Color("#E3CFA6") },
      uGoldDim: { value: new THREE.Color("#8C7650") },
      uTeal: { value: new THREE.Color("#4C9DAB") },
    }),
    [reduced],
  );

  const ringUniforms = useMemo(
    () => ({
      uRingPos: { value: new THREE.Vector2() },
      uRingSize: { value: 0.2 },
      uRingOpacity: { value: 0 },
      uAspect: uniforms.uAspect,
      uTime: uniforms.uTime,
      uTeal: uniforms.uTeal,
    }),
    [uniforms],
  );

  const materials = useMemo(() => {
    const common = {
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    };
    return {
      points: new THREE.ShaderMaterial({
        ...common,
        uniforms: { ...uniforms, uAtlas: { value: null as THREE.Texture | null } },
        vertexShader: pointsVertex,
        fragmentShader: pointsFragment,
      }),
      links: new THREE.ShaderMaterial({
        ...common,
        uniforms,
        vertexShader: linksVertex,
        fragmentShader: linksFragment,
      }),
      ring: new THREE.ShaderMaterial({
        ...common,
        uniforms: ringUniforms,
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
      }),
    };
  }, [uniforms, ringUniforms]);

  const ringGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  // Build atlas + geometry once fonts are available.
  useEffect(() => {
    let cancelled = false;
    let result: Built | null = null;
    const serif = cssFontFamily("--font-playfair", "'Playfair Display', Georgia, serif");
    const arabic = cssFontFamily("--font-arabic", "'Noto Naskh Arabic', 'Amiri', 'Geeza Pro', serif");
    (async () => {
      await waitForFonts([
        { family: arabic, sample: "ابتثجحخ", weight: "600" },
        { family: serif, sample: "SIaei", weight: "600" },
      ]);
      if (cancelled) return;
      const { texture } = buildGlyphAtlas(arabic, serif);
      const count = mobile ? 2200 : 6500;
      const field = buildField(count, mobile, window.innerWidth / window.innerHeight);
      result = { ...field, atlas: texture };
      if (cancelled) {
        field.points.dispose();
        field.links.dispose();
        texture.dispose();
        return;
      }
      materials.points.uniforms.uAtlas.value = texture;
      setBuilt(result);
    })();
    return () => {
      cancelled = true;
      if (result) {
        result.points.dispose();
        result.links.dispose();
        result.atlas.dispose();
      }
    };
  }, [mobile, materials]);

  useEffect(
    () => () => {
      materials.points.dispose();
      materials.links.dispose();
      materials.ring.dispose();
      ringGeometry.dispose();
    },
    [materials, ringGeometry],
  );

  // Layout uniforms follow the viewport.
  useEffect(() => {
    if (!built) return;
    const l = layoutFor(size.width / size.height, built.slotW);
    uniforms.uHalf.value.copy(l.half);
    uniforms.uMonoCenter.value.copy(l.monoCenter);
    uniforms.uMonoScale.value = l.monoScale;
    uniforms.uLineExtent.value.copy(l.lineExtent);
    uniforms.uLineOffset.value.copy(l.lineOffset);
    uniforms.uLineGlyph.value = l.lineGlyph;
    uniforms.uAspect.value = size.width / size.height;
    invalidate();
  }, [built, size.width, size.height, uniforms, invalidate]);

  // Fade the field in, tell the DOM the canvas is ready to be shown.
  useEffect(() => {
    if (!built) return;
    let raf = 0;
    let tween: gsap.core.Tween | null = null;
    if (reduced) {
      uniforms.uReveal.value = 1;
      invalidate();
    } else {
      tween = gsap.to(uniforms.uReveal, { value: 1, duration: 2.8, ease: "power2.out" });
    }
    raf = requestAnimationFrame(() => onReady());
    return () => {
      cancelAnimationFrame(raf);
      tween?.kill();
    };
  }, [built, reduced, uniforms, invalidate, onReady]);

  // Formation: converge into the monogram after the intro, then breathe out,
  // and keep breathing slowly while the hero is on screen.
  useEffect(() => {
    if (!built || reduced || !introDone) return;
    const f = form.current;
    const tl = gsap.timeline({ delay: 0.4, repeat: -1, repeatDelay: 7 });
    tl.to(f, { value: 1, duration: 2.8, ease: "power3.inOut" }).to(f, { value: 0, duration: 3.6, ease: "sine.inOut" }, "+=1.9");
    return () => {
      tl.kill();
    };
  }, [built, reduced, introDone]);

  // Pointer (desktop only): tracked on window because the DOM overlay sits on top.
  useEffect(() => {
    if (mobile || reduced) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      heroState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      heroState.pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
      heroState.pointerActive = true;
    };
    const leave = () => {
      heroState.pointerActive = false;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      heroState.pointerActive = false;
    };
  }, [mobile, reduced]);

  useFrame((state, delta) => {
    const u = uniforms;
    const dt = Math.min(delta, 1 / 20);
    const damp = THREE.MathUtils.damp;
    const dpr = state.viewport.dpr;
    u.uPixelScale.value = (state.size.height * dpr) / (2 * TAN);

    if (reduced) {
      u.uForm.value = 1;
      return;
    }

    u.uTime.value += dt;
    const scroll = (u.uScroll.value = damp(u.uScroll.value, heroState.scroll, 3.5, dt));
    u.uForm.value = form.current.value * (1 - smoothstep(0, 0.3, scroll));

    const m = mouse.current;
    const t = u.uTime.value;
    // touch devices get a slow automatic sway instead of pointer parallax
    const px = mobile ? Math.sin(t * 0.11) * 0.6 : heroState.pointerX;
    const py = mobile ? Math.cos(t * 0.083) * 0.4 : heroState.pointerY;
    m.x = damp(m.x, px, 5, dt);
    m.y = damp(m.y, py, 5, dt);
    m.rx = damp(m.rx, px, 14, dt);
    m.ry = damp(m.ry, py, 14, dt);
    u.uMouse.value.set(m.x, m.y);
    ringUniforms.uRingPos.value.set(m.rx, m.ry);

    const lensOn = !mobile && heroState.pointerActive ? 1 - smoothstep(0.15, 0.5, scroll) : 0;
    u.uLens.value = damp(u.uLens.value, lensOn, 4, dt);
    ringUniforms.uRingOpacity.value = u.uLens.value * 0.85;

    const cam = state.camera;
    const sway = 1 - scroll * 0.7;
    cam.position.x = damp(cam.position.x, m.x * 0.45 * sway, 1.6, dt);
    cam.position.y = damp(cam.position.y, m.y * 0.28 * sway, 1.6, dt);
    cam.position.z = CAM_Z - scroll * 0.6;
    cam.lookAt(0, 0, 0);
  });

  if (!built) return null;
  return (
    <>
      <points geometry={built.points} material={materials.points} frustumCulled={false} />
      <lineSegments geometry={built.links} material={materials.links} frustumCulled={false} renderOrder={1} />
      {!mobile && !reduced && (
        <mesh geometry={ringGeometry} material={materials.ring} frustumCulled={false} renderOrder={2} />
      )}
    </>
  );
}
