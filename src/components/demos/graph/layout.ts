/**
 * 3D force-directed layout (plain O(n^2) repulsion; fine for a few hundred nodes).
 * Written as a generator so it can run in a Web Worker or be chunked on the main thread.
 */

export interface LayoutInput {
  n: number;
  edges: Uint32Array;
  field: Uint8Array;
  fieldCount: number;
  iterations: number;
  seed: number;
}

export interface LayoutFrame {
  progress: number;
  positions: Float32Array;
  done: boolean;
}

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function* layoutSteps(input: LayoutInput, emitEvery = 10): Generator<LayoutFrame> {
  const { n, edges, field, fieldCount, iterations } = input;
  const rng = rand(input.seed);
  const pos = new Float32Array(n * 3);
  const vel = new Float32Array(n * 3);
  const force = new Float32Array(n * 3);

  // cluster centres on a Fibonacci sphere
  const R = 30;
  const centres = new Float32Array(fieldCount * 3);
  for (let f = 0; f < fieldCount; f++) {
    const y = 1 - ((f + 0.5) / fieldCount) * 2;
    const r = Math.sqrt(1 - y * y);
    const phi = f * 2.399963;
    centres[f * 3] = Math.cos(phi) * r * R;
    centres[f * 3 + 1] = y * R * 0.7;
    centres[f * 3 + 2] = Math.sin(phi) * r * R;
  }
  for (let i = 0; i < n; i++) {
    const f = field[i];
    pos[i * 3] = centres[f * 3] + (rng() - 0.5) * 24;
    pos[i * 3 + 1] = centres[f * 3 + 1] + (rng() - 0.5) * 24;
    pos[i * 3 + 2] = centres[f * 3 + 2] + (rng() - 0.5) * 24;
  }

  const kRep = 70;
  const kSpring = 0.04;
  const restLen = 9;
  const kCluster = 0.012;
  const kGravity = 0.004;
  const m = edges.length / 2;

  for (let it = 0; it < iterations; it++) {
    const alpha = 1 - (it / iterations) * 0.94;
    force.fill(0);

    for (let i = 0; i < n; i++) {
      const ix = pos[i * 3], iy = pos[i * 3 + 1], iz = pos[i * 3 + 2];
      for (let j = i + 1; j < n; j++) {
        let dx = ix - pos[j * 3];
        let dy = iy - pos[j * 3 + 1];
        let dz = iz - pos[j * 3 + 2];
        let d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 0.01) {
          dx = rng() - 0.5; dy = rng() - 0.5; dz = rng() - 0.5;
          d2 = 0.01;
        }
        if (d2 > 3600) continue;
        const d = Math.sqrt(d2);
        const f = kRep / d2 / d;
        force[i * 3] += dx * f; force[i * 3 + 1] += dy * f; force[i * 3 + 2] += dz * f;
        force[j * 3] -= dx * f; force[j * 3 + 1] -= dy * f; force[j * 3 + 2] -= dz * f;
      }
    }

    for (let e = 0; e < m; e++) {
      const a = edges[e * 2], b = edges[e * 2 + 1];
      const dx = pos[b * 3] - pos[a * 3];
      const dy = pos[b * 3 + 1] - pos[a * 3 + 1];
      const dz = pos[b * 3 + 2] - pos[a * 3 + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
      const f = (kSpring * (d - restLen)) / d;
      force[a * 3] += dx * f; force[a * 3 + 1] += dy * f; force[a * 3 + 2] += dz * f;
      force[b * 3] -= dx * f; force[b * 3 + 1] -= dy * f; force[b * 3 + 2] -= dz * f;
    }

    for (let i = 0; i < n; i++) {
      const f = field[i];
      for (let k = 0; k < 3; k++) {
        const p = pos[i * 3 + k];
        let fk = force[i * 3 + k];
        fk += (centres[f * 3 + k] - p) * kCluster - p * kGravity;
        let v = (vel[i * 3 + k] + fk) * 0.62;
        if (v > 3) v = 3;
        else if (v < -3) v = -3;
        vel[i * 3 + k] = v;
        pos[i * 3 + k] = p + v * alpha;
      }
    }

    const done = it === iterations - 1;
    if (done || it % emitEvery === 0) {
      yield { progress: (it + 1) / iterations, positions: pos.slice(), done };
    }
  }
}
