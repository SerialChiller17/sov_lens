import { useSyncExternalStore, type ReactNode } from "react";

const DESKTOP_MIN_WIDTH_PX = 768;
const DESKTOP_VIEWPORT_QUERY = `(min-width: ${DESKTOP_MIN_WIDTH_PX}px)`;

interface DesktopOnlyGateProps {
  children: ReactNode;
}

function isDesktopViewport() {
  if (typeof window === "undefined") {
    return false;
  }

  if (typeof window.matchMedia === "function") {
    return window.matchMedia(DESKTOP_VIEWPORT_QUERY).matches;
  }

  return window.innerWidth >= DESKTOP_MIN_WIDTH_PX;
}

function subscribeToViewportChange(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (typeof window.matchMedia === "function") {
    const mediaQueryList = window.matchMedia(DESKTOP_VIEWPORT_QUERY);
    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", onStoreChange);
      return () => mediaQueryList.removeEventListener("change", onStoreChange);
    }

    mediaQueryList.addListener(onStoreChange);
    return () => mediaQueryList.removeListener(onStoreChange);
  }

  window.addEventListener("resize", onStoreChange);
  return () => window.removeEventListener("resize", onStoreChange);
}

function MobileUnsupportedScreen() {
  return (
    <main className="mobile-unsupported-screen" aria-labelledby="mobile-unsupported-title">
      <section className="mobile-unsupported-card" aria-describedby="mobile-unsupported-copy mobile-unsupported-note">
        <span className="mobile-unsupported-badge">Desktop-first beta</span>
        <div className="mobile-unsupported-terminal" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h1 id="mobile-unsupported-title">Finance Terminal is currently available on larger screens</h1>
        <p id="mobile-unsupported-copy">
          This product is designed for PC, laptops, and tablets to give you the best market analysis experience.
        </p>
        <p>Mobile version and app are coming soon.</p>
        <strong id="mobile-unsupported-note">Please open this on a PC, laptop, or tablet.</strong>
      </section>
    </main>
  );
}

export function DesktopOnlyGate({ children }: DesktopOnlyGateProps) {
  const canRenderProduct = useSyncExternalStore(
    subscribeToViewportChange,
    isDesktopViewport,
    () => false,
  );

  if (!canRenderProduct) {
    return <MobileUnsupportedScreen />;
  }

  return <>{children}</>;
}
