"use client";

import { useEffect, useMemo, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Vector3 } from "three";
import { createStoryAssets, type StoryAssets } from "./assets";
import PageStage from "./PageStage";
import Archive from "./Archive";
import Blocks from "./Blocks";
import Graph from "./Graph";
import type { StoryGraph } from "../graph";
import { CAMERA_KEYS, smooth, type StoryClock } from "../timeline";

type Props = {
  progress: MutableRefObject<number>;
  active: boolean;
  isMobile: boolean;
  graph: StoryGraph;
  onReady?: () => void;
};

/** The one persistent WebGL scene behind the pinned story. Loaded with next/dynamic (ssr: false). */
export default function StoryScene({ progress, active, isMobile, graph, onReady }: Props) {
  const [assets, setAssets] = useState<StoryAssets | null>(null);

  useEffect(() => {
    let alive = true;
    let made: StoryAssets | null = null;
    createStoryAssets(isMobile, isMobile ? 2600 : 7000)
      .then((a) => {
        if (!alive) {
          a.dispose();
          return;
        }
        made = a;
        setAssets(a);
      })
      .catch(() => {
        /* WebGL/canvas unavailable: overlay text still tells the story */
      });
    return () => {
      alive = false;
      made?.dispose();
      setAssets(null);
    };
  }, [isMobile]);

  useEffect(() => {
    if (assets) onReady?.();
  }, [assets, onReady]);

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={isMobile ? [1, 1.5] : [1, 1.75]}
      frameloop={active ? "always" : "never"}
      linear
      flat
      gl={{ antialias: !isMobile, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: 40, near: 0.1, far: 120, position: [1.1, 0.6, 7.6] }}
    >
      <color attach="background" args={["#060B18"]} />
      {assets && <SceneRoot assets={assets} progress={progress} isMobile={isMobile} graph={graph} />}
      {!isMobile && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.7} luminanceSmoothing={0.25} radius={0.7} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

function SceneRoot({
  assets,
  progress,
  isMobile,
  graph,
}: {
  assets: StoryAssets;
  progress: MutableRefObject<number>;
  isMobile: boolean;
  graph: StoryGraph;
}) {
  const clock = useMemo<StoryClock>(() => ({ p: progress.current, t: 0 }), [progress]);
  const pixelRatio = useThree((s) => s.viewport.dpr);
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const tmp = useMemo(() => ({ pos: new Vector3(), look: new Vector3(), a: new Vector3(), b: new Vector3() }), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    clock.t += dt;
    const target = progress.current;
    // Light damping on top of Lenis; snap if far away (e.g. after a rail jump).
    const k = Math.abs(target - clock.p) > 0.25 ? 1 : 1 - Math.exp(-dt * 7);
    clock.p += (target - clock.p) * k;
    const p = clock.p;

    // Camera along keyframes
    let i = 0;
    while (i < CAMERA_KEYS.length - 2 && p > CAMERA_KEYS[i + 1].p) i++;
    const k0 = CAMERA_KEYS[i];
    const k1 = CAMERA_KEYS[i + 1];
    const f = smooth(Math.min(1, Math.max(0, (p - k0.p) / (k1.p - k0.p))));
    tmp.pos.fromArray(k0.pos).lerp(tmp.b.fromArray(k1.pos), f);
    tmp.look.fromArray(k0.look).lerp(tmp.b.fromArray(k1.look), f);
    const shift = isMobile ? 0 : k0.shift + (k1.shift - k0.shift) * f;
    tmp.pos.x += shift;
    tmp.look.x += shift;
    // Portrait screens: pull back so the subject fits the width.
    if (aspect < 1) {
      const mul = Math.min(1.9, Math.max(1, 0.85 / aspect));
      tmp.a.copy(tmp.pos).sub(tmp.look).multiplyScalar(mul);
      tmp.pos.copy(tmp.look).add(tmp.a);
    }
    // a slow breath of handheld drift
    tmp.pos.x += Math.sin(clock.t * 0.21) * 0.06;
    tmp.pos.y += Math.cos(clock.t * 0.17) * 0.04;
    state.camera.position.copy(tmp.pos);
    state.camera.lookAt(tmp.look);
  });

  return (
    <>
      <Archive assets={assets} clock={clock} pixelRatio={pixelRatio} isMobile={isMobile} />
      <PageStage assets={assets} clock={clock} pixelRatio={pixelRatio} />
      <Blocks assets={assets} clock={clock} layoutScale={aspect < 1 ? 0.62 : 1} />
      <Graph assets={assets} graph={graph} clock={clock} pixelRatio={pixelRatio} isMobile={isMobile} />
    </>
  );
}
