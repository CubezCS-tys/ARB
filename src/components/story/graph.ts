/**
 * Deterministic, illustrative citation graph for chapter IV/V.
 * Node 0 is "the current document" at the origin; every other node links to a
 * nearer node, so the graph is connected and grows outward from the centre.
 */

export type StoryGraph = {
  count: number;
  positions: Float32Array; // count * 3
  dist: Float32Array; // 0..1, normalised distance from centre (reveal order)
  sizes: Float32Array;
  colors: Float32Array; // count * 3
  edges: Uint32Array; // pairs of node indices
  edgeCount: number;
  sources: number[]; // the 3 cited nodes
  paths: number[][]; // node chains from 0 to each source
};

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P3 = [number, number, number];
const len3 = (p: P3) => Math.hypot(p[0], p[1], p[2]);
const d2 = (a: P3, b: P3) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

export function buildGraph(n: number, seed = 11): StoryGraph {
  const rnd = mulberry32(seed);
  const gauss = () => {
    let u = 0;
    while (u === 0) u = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
  };

  const clusterCount = 7;
  const clusters: P3[] = Array.from({ length: clusterCount }, (_, k) => {
    const th = (k / clusterCount) * Math.PI * 2 + rnd() * 0.5;
    const r = 4.5 + rnd() * 3.8;
    return [Math.cos(th) * r, (rnd() - 0.5) * 4.5, Math.sin(th) * r * 0.75];
  });

  const raw: P3[] = [];
  for (let i = 1; i < n; i++) {
    if (rnd() < 0.3) {
      const r = 1.8 + Math.cbrt(rnd()) * 8.8;
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      raw.push([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.55, r * Math.sin(ph) * Math.sin(th)]);
    } else {
      const c = clusters[Math.floor(rnd() * clusterCount)];
      const sd = 1.25;
      raw.push([c[0] + gauss() * sd, c[1] + gauss() * sd * 0.7, c[2] + gauss() * sd]);
    }
  }
  raw.sort((a, b) => len3(a) - len3(b));
  const pts: P3[] = [[0, 0, 0], ...raw];
  const maxD = Math.max(1e-3, ...pts.map(len3));

  // Edges: each node cites its nearest (and sometimes second nearest) earlier node.
  const keys = new Set<string>();
  const edgeList: number[] = [];
  const adj: number[][] = pts.map(() => []);
  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (keys.has(k)) return;
    keys.add(k);
    edgeList.push(a, b);
    adj[a].push(b);
    adj[b].push(a);
  };
  for (let i = 1; i < n; i++) {
    let best = -1;
    let bestD = Infinity;
    let second = -1;
    let secondD = Infinity;
    const samples = Math.min(i, 36);
    for (let s = 0; s < samples; s++) {
      const j = i <= 36 ? s : Math.floor(rnd() * i);
      const dd = d2(pts[i], pts[j]);
      if (dd < bestD) {
        second = best;
        secondD = bestD;
        best = j;
        bestD = dd;
      } else if (dd < secondD && j !== best) {
        second = j;
        secondD = dd;
      }
    }
    addEdge(i, best);
    if (second >= 0 && rnd() < 0.55) addEdge(i, second);
  }
  for (let i = 1; i < Math.min(13, n); i++) addEdge(0, i);

  const positions = new Float32Array(n * 3);
  const dist = new Float32Array(n);
  const sizes = new Float32Array(n);
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    positions.set(pts[i], i * 3);
    dist[i] = len3(pts[i]) / maxD;
    const deg = adj[i].length;
    sizes[i] = i === 0 ? 7 : 1.4 + Math.sqrt(deg) * 1.05 + rnd() * 0.6;
    const r = rnd();
    const c: P3 = r < 0.28 ? [0.3, 0.62, 0.67] : r < 0.4 ? [0.89, 0.81, 0.65] : [0.8, 0.69, 0.49];
    colors.set(c, i * 3);
  }

  // Three cited sources spread across the frame, at mid distance.
  const candidates: number[] = [];
  for (let i = 1; i < n; i++) if (dist[i] > 0.42 && dist[i] < 0.75) candidates.push(i);
  const targets = [Math.PI * 0.85, Math.PI * 0.12, -Math.PI * 0.55];
  const sources: number[] = [];
  for (const ta of targets) {
    let best = -1;
    let bestScore = Infinity;
    for (const c of candidates) {
      if (sources.includes(c)) continue;
      const a = Math.atan2(pts[c][1] * 1.6, pts[c][0]);
      let da = Math.abs(a - ta);
      if (da > Math.PI) da = Math.PI * 2 - da;
      if (da < bestScore) {
        bestScore = da;
        best = c;
      }
    }
    sources.push(best >= 0 ? best : Math.min(n - 1, 1 + sources.length));
  }

  // BFS parents from the centre.
  const parent = new Int32Array(n).fill(-1);
  parent[0] = 0;
  const queue = [0];
  for (let q = 0; q < queue.length; q++) {
    const u = queue[q];
    for (const v of adj[u]) {
      if (parent[v] === -1) {
        parent[v] = u;
        queue.push(v);
      }
    }
  }
  const paths = sources.map((s) => {
    const chain = [s];
    let cur = s;
    while (cur !== 0 && parent[cur] >= 0) {
      cur = parent[cur];
      chain.push(cur);
    }
    return chain.reverse();
  });

  return {
    count: n,
    positions,
    dist,
    sizes,
    colors,
    edges: new Uint32Array(edgeList),
    edgeCount: edgeList.length / 2,
    sources,
    paths,
  };
}
