"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import { BLOCKS, type StoryAssets } from "./assets";
import { mulberry32 } from "../graph";
import { T, seg, mix, type StoryClock } from "../timeline";

/** Chapter III: OCR text bursts into labelled blocks that settle into a layered layout,
 *  then (chapter IV) collapse into the glowing centre node. */
export default function Blocks({
  assets,
  clock,
  layoutScale,
}: {
  assets: StoryAssets;
  clock: StoryClock;
  layoutScale: number;
}) {
  const root = useRef<Group>(null);
  const meshes = useRef<(Mesh | null)[]>([]);

  const res = useMemo(() => {
    const rnd = mulberry32(3);
    return BLOCKS.map((b, i) => {
      const geo = new PlaneGeometry(b.w, b.h);
      const mat = new MeshBasicMaterial({
        map: assets.blocks[i],
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: DoubleSide,
      });
      const dir = [b.start[0] * 0.9 + (rnd() - 0.5) * 1.2, b.start[1] * 0.5 + (rnd() - 0.5) * 1.0, 0.9 + rnd() * 1.4];
      const spin = [(rnd() - 0.5) * 0.9, (rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.6];
      return { geo, mat, dir, spin };
    });
  }, [assets]);

  useEffect(
    () => () => {
      res.forEach((r) => {
        r.geo.dispose();
        r.mat.dispose();
      });
    },
    [res],
  );

  useFrame(() => {
    const { p, t } = clock;
    const g = root.current;
    if (!g) return;
    const vis = p > T.blocksIn[0] - 0.01 && p < T.collapse[1] + 0.01;
    g.visible = vis;
    if (!vis) return;

    const appear = seg(p, T.blocksIn[0], T.blocksIn[1]);
    const collapse = seg(p, T.collapse[0], T.collapse[1]);
    BLOCKS.forEach((b, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const r = res[i];
      const stagger = i * 0.006;
      const burst = seg(p, T.burst[0] + stagger * 0.5, T.burst[1] + stagger * 0.5);
      const settle = seg(p, T.layout[0] + stagger, T.layout[1] + stagger * 0.4);

      const sx = b.start[0] * 0.96;
      const sy = b.start[1] * 0.96;
      const sz = 0.6;
      const bx = sx + r.dir[0];
      const by = sy + r.dir[1];
      const bz = sz + r.dir[2];
      const tx = b.target[0] * layoutScale;
      const ty = b.target[1] * layoutScale;
      const tz = b.target[2];

      let x = mix(mix(sx, bx, burst), tx, settle);
      let y = mix(mix(sy, by, burst), ty, settle);
      let z = mix(mix(sz, bz, burst), tz, settle);
      const float = Math.sin(t * 0.8 + i) * 0.025 * settle * (1 - collapse);
      y += float;

      x = mix(x, 0, collapse);
      y = mix(y, 0, collapse);
      z = mix(z, 0, collapse);
      m.position.set(x, y, z);

      const spinAmt = burst * (1 - settle);
      m.rotation.set(r.spin[0] * spinAmt, r.spin[1] * spinAmt + 0.1 * settle, r.spin[2] * spinAmt);
      const startScale = 0.55;
      const s = mix(mix(startScale, 1, burst), 1, settle) * layoutScale * (1 - collapse * 0.97);
      m.scale.setScalar(s);
      r.mat.opacity = appear * (1 - seg(p, T.collapse[0] + 0.02, T.collapse[1]));
    });
  });

  return (
    <group ref={root}>
      {res.map((r, i) => (
        <mesh
          key={BLOCKS[i].kind}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={r.geo}
          material={r.mat}
          renderOrder={8}
        />
      ))}
    </group>
  );
}
