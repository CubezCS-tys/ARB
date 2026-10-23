import { hexToRgb, type Graph } from "./data";

export interface ViewState {
  selected: number | null;
  /** search hits; null when no search is active */
  matches: Set<number> | null;
  fieldFilter: number | null;
  yearMax: number;
}

export interface Lineage {
  /** id -> depth (1 = direct) */
  ancestors: Map<number, number>;
  descendants: Map<number, number>;
}

export interface Visual {
  nodeColor: Float32Array;
  nodeScale: Float32Array;
  edgeColor: Float32Array; // 2 vertices x rgb per edge
  /** edges eligible for travelling pulses, with their pulse colour */
  pulseEdges: Uint32Array;
  pulseColor: Float32Array;
  visibleCount: number;
}

const GOLD = hexToRgb("#E3CFA6");
const TEAL = hexToRgb("#7CC4CF");
const FOCUS: [number, number, number] = [1, 0.98, 0.94];
const MAX_DEPTH = 2;

export function lineageOf(graph: Graph, id: number, yearMax: number): Lineage {
  const walk = (dir: "cites" | "citedBy") => {
    const out = new Map<number, number>();
    let frontier = [id];
    for (let depth = 1; depth <= MAX_DEPTH && frontier.length; depth++) {
      const next: number[] = [];
      for (const f of frontier) {
        for (const k of graph.papers[f][dir]) {
          if (k === id || out.has(k) || graph.papers[k].year > yearMax) continue;
          out.set(k, depth);
          next.push(k);
        }
      }
      frontier = next;
    }
    return out;
  };
  return { ancestors: walk("cites"), descendants: walk("citedBy") };
}

export function computeVisual(graph: Graph, view: ViewState, lineage: Lineage | null): Visual {
  const { papers, edges } = graph;
  const n = papers.length;
  const m = edges.length / 2;
  const fieldRgb = graph.fields.map((f) => hexToRgb(f.color));
  const nodeColor = new Float32Array(n * 3);
  const nodeScale = new Float32Array(n);
  const edgeColor = new Float32Array(m * 6);
  const pulse: number[] = [];
  const pulseCol: number[] = [];
  let visibleCount = 0;

  const highlight: Set<number> | null =
    view.matches ?? (view.fieldFilter !== null ? new Set(papers.filter((p) => p.field === view.fieldFilter).map((p) => p.id)) : null);
  const focusing = view.selected !== null && lineage !== null;

  for (let i = 0; i < n; i++) {
    const p = papers[i];
    const visible = p.year <= view.yearMax;
    if (visible) visibleCount++;
    let c = fieldRgb[p.field];
    let s = visible ? 1 : 0;
    let k = 0.85;
    if (focusing) {
      if (i === view.selected) {
        c = FOCUS;
        k = 1.2;
        s *= 1.35;
      } else if (lineage!.ancestors.has(i)) {
        c = GOLD;
        k = lineage!.ancestors.get(i) === 1 ? 1.05 : 0.6;
      } else if (lineage!.descendants.has(i)) {
        c = TEAL;
        k = lineage!.descendants.get(i) === 1 ? 1.05 : 0.6;
      } else {
        k = 0.1;
        s *= 0.75;
      }
    } else if (highlight) {
      if (highlight.has(i)) {
        k = 1.15;
        s *= 1.15;
      } else {
        k = 0.12;
        s *= 0.8;
      }
    }
    nodeColor[i * 3] = c[0] * k;
    nodeColor[i * 3 + 1] = c[1] * k;
    nodeColor[i * 3 + 2] = c[2] * k;
    nodeScale[i] = s;
  }

  for (let e = 0; e < m; e++) {
    const a = edges[e * 2];
    const b = edges[e * 2 + 1];
    const visible = papers[a].year <= view.yearMax && papers[b].year <= view.yearMax;
    let ca = fieldRgb[papers[a].field];
    let cb = fieldRgb[papers[b].field];
    let k = visible ? 0.2 : 0;
    let pc: [number, number, number] | null = visible ? GOLD : null;

    if (focusing && visible) {
      const sel = view.selected!;
      const anc = lineage!.ancestors;
      const des = lineage!.descendants;
      // ancestor chain: b is focus or ancestor, a is ancestor
      const ancEdge = anc.has(a) && (b === sel || anc.has(b));
      const desEdge = des.has(b) && (a === sel || des.has(a));
      if (ancEdge) {
        ca = cb = GOLD;
        k = b === sel ? 0.95 : 0.45;
        pc = GOLD;
      } else if (desEdge) {
        ca = cb = TEAL;
        k = a === sel ? 0.95 : 0.45;
        pc = TEAL;
      } else {
        k = 0.025;
        pc = null;
      }
    } else if (highlight && visible) {
      const on = highlight.has(a) || highlight.has(b);
      k = on ? 0.4 : 0.03;
      if (!on) pc = null;
    }

    edgeColor[e * 6] = ca[0] * k;
    edgeColor[e * 6 + 1] = ca[1] * k;
    edgeColor[e * 6 + 2] = ca[2] * k;
    edgeColor[e * 6 + 3] = cb[0] * k;
    edgeColor[e * 6 + 4] = cb[1] * k;
    edgeColor[e * 6 + 5] = cb[2] * k;
    if (pc) {
      pulse.push(e);
      pulseCol.push(pc[0], pc[1], pc[2]);
    }
  }

  return {
    nodeColor,
    nodeScale,
    edgeColor,
    pulseEdges: Uint32Array.from(pulse),
    pulseColor: Float32Array.from(pulseCol),
    visibleCount,
  };
}
