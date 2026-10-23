"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import GlyphField from "./GlyphField";
import { CAM_Z, FOV } from "./field";

type Props = {
  active: boolean;
  mobile: boolean;
  reduced: boolean;
  introDone: boolean;
  onReady: () => void;
};

/** The single hero WebGL canvas. Imported with next/dynamic (ssr: false) from Hero.tsx. */
export default function HeroCanvas({ active, mobile, reduced, introDone, onReady }: Props) {
  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 1.75]}
      frameloop={reduced ? "demand" : active ? "always" : "never"}
      camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 0.1, far: 60 }}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false }}
      flat
      aria-hidden
    >
      <color attach="background" args={["#060B18"]} />
      <GlyphField mobile={mobile} reduced={reduced} introDone={introDone} onReady={onReady} />
      {!mobile && (
        <EffectComposer multisampling={0} stencilBuffer={false}>
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.16} luminanceSmoothing={0.35} radius={0.72} />
          <Vignette eskil={false} offset={0.28} darkness={0.72} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
