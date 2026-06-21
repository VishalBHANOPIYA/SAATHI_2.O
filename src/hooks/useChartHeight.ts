"use client";

import { useState, useEffect } from "react";

/**
 * Returns a responsive chart height based on the current window width.
 * - Mobile (< 768px): 200px
 * - Tablet (768px–1199px): 260px
 * - Desktop (≥ 1200px): 320px
 */
export function useChartHeight(): number {
  const [chartHeight, setChartHeight] = useState(200);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1200) setChartHeight(320);
      else if (w >= 768) setChartHeight(260);
      else setChartHeight(200);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return chartHeight;
}

/**
 * Returns true when the viewport is at least `minWidth` px.
 */
export function useMediaQuery(minWidth: number): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const update = () => setMatches(window.innerWidth >= minWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [minWidth]);

  return matches;
}
