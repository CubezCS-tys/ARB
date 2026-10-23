import { layoutSteps, type LayoutInput } from "./layout";

// Typed loosely so the project's DOM-only tsconfig lib is enough
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<LayoutInput & { emitEvery: number }>) => void) | null;
  postMessage: (msg: unknown, transfer?: Transferable[]) => void;
};

ctx.onmessage = (e) => {
  const { emitEvery, ...input } = e.data;
  const gen = layoutSteps(input, emitEvery);
  for (let r = gen.next(); !r.done; r = gen.next()) {
    ctx.postMessage(r.value, [r.value.positions.buffer]);
  }
};
