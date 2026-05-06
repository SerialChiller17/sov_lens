import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type LiquidMetalButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  viewMode?: "text" | "icon";
};

const STYLE_ID = "liquid-metal-button-styles";

function ensureLiquidMetalButtonStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .liquid-metal-button {
      --liquid-metal-rim-size: 2px;
      position: relative;
      isolation: isolate;
      overflow: hidden;
      transform-style: preserve-3d;
      -webkit-tap-highlight-color: transparent;
    }

    .liquid-metal-button-base,
    .liquid-metal-button-shader,
    .liquid-metal-button-sheen {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
    }

    .liquid-metal-button-base {
      z-index: 2;
      inset: var(--liquid-metal-rim-size);
      background:
        radial-gradient(ellipse at 40% 0%, rgba(255, 255, 255, 0.16), transparent 46%),
        linear-gradient(180deg, rgb(33, 33, 31) 0%, rgb(11, 11, 10) 48%, rgb(1, 1, 1) 100%);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -0.34rem 0.62rem rgba(0, 0, 0, 0.68);
    }

    .liquid-metal-button-shader {
      z-index: 0;
      opacity: 0.72;
      mix-blend-mode: screen;
      filter: saturate(1.18) contrast(1.18);
      transition: opacity 180ms ease, filter 180ms ease;
    }

    .liquid-metal-button-shader canvas {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      position: absolute !important;
      inset: 0 !important;
      border-radius: inherit !important;
    }

    .liquid-metal-button-sheen {
      z-index: 1;
      background:
        linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.24) 42%, transparent 54%),
        radial-gradient(circle at 18% 14%, rgba(255, 255, 255, 0.3), transparent 1.35rem);
      opacity: 0.24;
      transform: translateX(-42%);
      transition: opacity 180ms ease, transform 220ms ease;
    }

    .liquid-metal-button-content {
      position: relative;
      z-index: 4;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: inherit;
      pointer-events: none;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.64);
    }

    .liquid-metal-button-ripple {
      position: absolute;
      z-index: 3;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 72%);
      pointer-events: none;
      animation: liquid-metal-button-ripple 620ms ease-out forwards;
    }

    .liquid-metal-button:hover .liquid-metal-button-shader,
    .liquid-metal-button:focus-visible .liquid-metal-button-shader {
      opacity: 0.86;
      filter: saturate(1.28) contrast(1.28);
    }

    .liquid-metal-button:hover .liquid-metal-button-sheen,
    .liquid-metal-button:focus-visible .liquid-metal-button-sheen {
      opacity: 0.42;
      transform: translateX(10%);
    }

    .liquid-metal-button.is-pressed .liquid-metal-button-base,
    .liquid-metal-button.is-pressed .liquid-metal-button-shader,
    .liquid-metal-button.is-pressed .liquid-metal-button-sheen {
      transform: translateY(1px) scale(0.985);
    }

    @keyframes liquid-metal-button-ripple {
      0% {
        opacity: 0.58;
        transform: translate(-50%, -50%) scale(0);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(4);
      }
    }
  `;
  document.head.appendChild(style);
}

export function LiquidMetalButton({
  label = "Get Started",
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onBlur,
  className,
  children,
  disabled,
  style,
  type = "button",
  viewMode = "text",
  ...buttonProps
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const shaderRef = useRef<HTMLSpanElement | null>(null);
  const shaderMount = useRef<ShaderMount | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const rippleId = useRef(0);
  const timeoutRefs = useRef<number[]>([]);

  const dimensions = useMemo(() => {
    if (viewMode === "icon") {
      return { width: 46, height: 46 };
    }

    return { width: 142, height: 46 };
  }, [viewMode]);

  useEffect(() => {
    ensureLiquidMetalButtonStyles();

    if (!shaderRef.current) return undefined;

    if (shaderMount.current) {
      shaderMount.current.dispose();
    }

    shaderMount.current = new ShaderMount(
      shaderRef.current,
      liquidMetalFragmentShader,
      {
        u_repetition: 4,
        u_softness: 0.5,
        u_shiftRed: 0.3,
        u_shiftBlue: 0.3,
        u_distortion: 0.06,
        u_contour: 0.12,
        u_angle: 45,
        u_scale: 8,
        u_shape: 1,
        u_offsetX: 0.1,
        u_offsetY: -0.1,
        u_isImage: false,
        u_image: undefined,
        u_colorBack: [0.01, 0.01, 0.01, 0],
        u_colorTint: [0.84, 0.82, 0.72, 1],
      },
      undefined,
      0.58,
      undefined,
      1,
      320000,
    );

    return () => {
      shaderMount.current?.dispose();
      shaderMount.current = null;
      timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutRefs.current = [];
    };
  }, []);

  const addTimeout = (callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      callback();
      timeoutRefs.current = timeoutRefs.current.filter((id) => id !== timeoutId);
    }, delay);
    timeoutRefs.current.push(timeoutId);
  };

  const handleMouseEnter: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    setIsHovered(true);
    shaderMount.current?.setSpeed(1);
    onMouseEnter?.(event);
  };

  const handleMouseLeave: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    setIsHovered(false);
    setIsPressed(false);
    shaderMount.current?.setSpeed(0.58);
    onMouseLeave?.(event);
  };

  const handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    setIsPressed(true);
    onMouseDown?.(event);
  };

  const handleMouseUp: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    setIsPressed(false);
    onMouseUp?.(event);
  };

  const handleBlur: React.FocusEventHandler<HTMLButtonElement> = (event) => {
    setIsPressed(false);
    setIsHovered(false);
    shaderMount.current?.setSpeed(0.58);
    onBlur?.(event);
  };

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (shaderMount.current) {
      shaderMount.current.setSpeed(2.35);
      addTimeout(() => {
        shaderMount.current?.setSpeed(isHovered ? 1 : 0.58);
      }, 300);
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const ripple = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        id: rippleId.current++,
      };

      setRipples((previousRipples) => [...previousRipples, ripple]);
      addTimeout(() => {
        setRipples((previousRipples) => previousRipples.filter((item) => item.id !== ripple.id));
      }, 620);
    }

    onClick?.(event);
  };

  const hasCustomShape = Boolean(className);

  return (
    <button
      {...buttonProps}
      ref={buttonRef}
      type={type}
      disabled={disabled}
      aria-label={buttonProps["aria-label"] ?? label}
      className={cn("liquid-metal-button", isPressed && "is-pressed", className)}
      style={{
        width: hasCustomShape ? undefined : `${dimensions.width}px`,
        height: hasCustomShape ? undefined : `${dimensions.height}px`,
        ...style,
      }}
      onBlur={handleBlur}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
    >
      <span className="liquid-metal-button-base" aria-hidden="true" />
      <span ref={shaderRef} className="liquid-metal-button-shader" aria-hidden="true" />
      <span className="liquid-metal-button-sheen" aria-hidden="true" />
      <span className="liquid-metal-button-content">
        {children ??
          (viewMode === "icon" ? (
            <Sparkles aria-hidden="true" size={16} />
          ) : (
            <span>{label}</span>
          ))}
      </span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="liquid-metal-button-ripple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
          }}
        />
      ))}
    </button>
  );
}
