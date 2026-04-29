import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

const INSIGHT_COMPANION_MAX_EYE_OFFSET = 4.5;
const INSIGHT_COMPANION_LOOK_EVENT = "insight-companion-look-at";
const INSIGHT_COMPANION_RESET_EVENT = "insight-companion-reset-look";

interface InsightCompanionLookDetail {
  clientX: number;
  clientY: number;
  duration?: number;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function dispatchInsightCompanionLookAt(detail: InsightCompanionLookDetail) {
  window.dispatchEvent(new CustomEvent<InsightCompanionLookDetail>(INSIGHT_COMPANION_LOOK_EVENT, { detail }));
}

export function resetInsightCompanionLook() {
  window.dispatchEvent(new CustomEvent(INSIGHT_COMPANION_RESET_EVENT));
}

export function InsightCompanion({ className = "" }: { className?: string }) {
  const companionRef = useRef<HTMLSpanElement | null>(null);
  const resetEyesTimerRef = useRef(0);
  const blinkTimerRef = useRef(0);
  const blinkEndTimerRef = useRef(0);
  const hoverBlinkEndTimerRef = useRef(0);
  const spinTimerRef = useRef(0);
  const spinEndTimerRef = useRef(0);
  const purrFrameRef = useRef(0);
  const purrStartTimeRef = useRef(0);
  const pointerMoveFrameRef = useRef(0);
  const latestPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isLooking, setIsLooking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isPurring, setIsPurring] = useState(false);

  const resetEyes = useCallback(() => {
    window.clearTimeout(resetEyesTimerRef.current);
    setIsLooking(false);
    setEyeOffset({ x: 0, y: 0 });
  }, []);

  const lookAtPoint = useCallback((clientX: number, clientY: number, duration = 3000) => {
    const companion = companionRef.current;
    if (!companion) return;

    const rect = companion.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const vectorX = clientX - centerX;
    const vectorY = clientY - centerY;
    const distance = Math.hypot(vectorX, vectorY) || 1;

    setIsLooking(true);
    setEyeOffset({
      x: (vectorX / distance) * INSIGHT_COMPANION_MAX_EYE_OFFSET,
      y: (vectorY / distance) * INSIGHT_COMPANION_MAX_EYE_OFFSET * 0.78,
    });

    window.clearTimeout(resetEyesTimerRef.current);
    if (duration >= 0) {
      resetEyesTimerRef.current = window.setTimeout(resetEyes, duration);
    }
  }, [resetEyes]);

  const triggerBlink = useCallback(() => {
    setIsBlinking(true);
    window.clearTimeout(hoverBlinkEndTimerRef.current);
    hoverBlinkEndTimerRef.current = window.setTimeout(() => {
      setIsBlinking(false);
    }, 150);
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      latestPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
      if (pointerMoveFrameRef.current) return;

      pointerMoveFrameRef.current = window.requestAnimationFrame(() => {
        pointerMoveFrameRef.current = 0;
        const pointer = latestPointerRef.current;
        if (!pointer) return;
        lookAtPoint(pointer.clientX, pointer.clientY, -1);
      });
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      latestPointerRef.current = null;
      resetEyes();
    };

    const handleDirectedLook = (event: Event) => {
      const detail = (event as CustomEvent<InsightCompanionLookDetail>).detail;
      if (!detail) return;
      lookAtPoint(detail.clientX, detail.clientY, detail.duration ?? 3000);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerout", handlePointerOut);
    window.addEventListener("blur", resetEyes);
    window.addEventListener(INSIGHT_COMPANION_LOOK_EVENT, handleDirectedLook as EventListener);
    window.addEventListener(INSIGHT_COMPANION_RESET_EVENT, resetEyes);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("blur", resetEyes);
      window.removeEventListener(INSIGHT_COMPANION_LOOK_EVENT, handleDirectedLook as EventListener);
      window.removeEventListener(INSIGHT_COMPANION_RESET_EVENT, resetEyes);
      window.cancelAnimationFrame(pointerMoveFrameRef.current);
      window.clearTimeout(resetEyesTimerRef.current);
    };
  }, [lookAtPoint, resetEyes]);

  useEffect(() => {
    const scheduleBlink = () => {
      blinkTimerRef.current = window.setTimeout(() => {
        setIsBlinking(true);
        blinkEndTimerRef.current = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 150);
      }, randomBetween(3000, 10000));
    };

    scheduleBlink();

    return () => {
      window.clearTimeout(blinkTimerRef.current);
      window.clearTimeout(blinkEndTimerRef.current);
      window.clearTimeout(hoverBlinkEndTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const scheduleSpin = () => {
      spinTimerRef.current = window.setTimeout(() => {
        setIsSpinning(true);
        spinEndTimerRef.current = window.setTimeout(() => {
          setIsSpinning(false);
          scheduleSpin();
        }, 1300);
      }, randomBetween(15000, 20000));
    };

    scheduleSpin();

    return () => {
      window.clearTimeout(spinTimerRef.current);
      window.clearTimeout(spinEndTimerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      window.cancelAnimationFrame(purrFrameRef.current);
    };
  }, []);

  const resetPurrTransform = () => {
    const companion = companionRef.current;
    if (!companion) return;

    companion.style.setProperty("--purr-x", "0px");
    companion.style.setProperty("--purr-y", "0px");
    companion.style.setProperty("--purr-rotate", "0deg");
  };

  const stopPurr = () => {
    setIsPurring(false);
    window.cancelAnimationFrame(purrFrameRef.current);
    purrFrameRef.current = 0;
    resetPurrTransform();
  };

  const startPurr = () => {
    triggerBlink();
    if (purrFrameRef.current) return;

    const companion = companionRef.current;
    if (!companion) return;

    setIsPurring(true);
    purrStartTimeRef.current = window.performance.now();

    const renderPurr = (now: number) => {
      const elapsedSeconds = (now - purrStartTimeRef.current) / 1000;
      const softAmplitude = 0.16 + Math.sin(elapsedSeconds * Math.PI * 1.7) * 0.025;
      const x =
        Math.sin(elapsedSeconds * Math.PI * 2 * 41) * softAmplitude +
        Math.sin(elapsedSeconds * Math.PI * 2 * 67 + 1.4) * 0.035;
      const y =
        Math.sin(elapsedSeconds * Math.PI * 2 * 37 + 0.8) * softAmplitude * 0.72 +
        Math.sin(elapsedSeconds * Math.PI * 2 * 59) * 0.03;
      const rotate = Math.sin(elapsedSeconds * Math.PI * 2 * 29 + 0.2) * 0.07;

      companion.style.setProperty("--purr-x", `${x.toFixed(3)}px`);
      companion.style.setProperty("--purr-y", `${y.toFixed(3)}px`);
      companion.style.setProperty("--purr-rotate", `${rotate.toFixed(3)}deg`);
      purrFrameRef.current = window.requestAnimationFrame(renderPurr);
    };

    purrFrameRef.current = window.requestAnimationFrame(renderPurr);
  };

  return (
    <span
      ref={companionRef}
      className={[
        "insight-companion",
        className,
        isLooking ? "is-looking" : "is-settling",
        isBlinking ? "is-blinking" : "",
        isSpinning ? "is-spinning" : "",
        isPurring ? "is-purring" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--eye-x": `${eyeOffset.x.toFixed(2)}px`,
          "--eye-y": `${eyeOffset.y.toFixed(2)}px`,
        } as CSSProperties
      }
      onPointerEnter={startPurr}
      onPointerLeave={stopPurr}
      onFocus={startPurr}
      onBlur={stopPurr}
      aria-hidden="true"
    >
      <span className="insight-companion-float">
        <span className="insight-companion-pulse-shell">
          <span className="insight-companion-purr-shell">
            <span className="insight-companion-body">
              <span className="insight-companion-eye-mask">
                <span className="insight-companion-eyes">
                  <span className="insight-companion-eye" />
                  <span className="insight-companion-eye" />
                </span>
              </span>
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}
