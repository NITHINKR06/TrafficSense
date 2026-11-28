import type { Map as MapInstance } from "maplibre-gl";

/**
 * Keeps MapLibre's WebGL canvas sized to its container across window resizes,
 * split-screen adjustments, and minimize/restore transitions.
 */
export function attachMapResizeObserver(
  container: HTMLElement | null,
  map: MapInstance
): () => void {
  const triggerResize = () => {
    try {
      map.resize();
    } catch {
      // Ignore if map has already been removed
    }
  };

  let observer: ResizeObserver | null = null;
  if (container && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => triggerResize());
    observer.observe(container);
  }

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      requestAnimationFrame(triggerResize);
    }
  };

  window.addEventListener("resize", triggerResize);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    observer?.disconnect();
    window.removeEventListener("resize", triggerResize);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
