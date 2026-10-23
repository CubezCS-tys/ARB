"use client";

import { Component, type ReactNode } from "react";

/** If WebGL is unavailable the canvas throws; swallow it so the static backdrop stays. */
export default class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") console.warn("[hero] WebGL scene disabled:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
