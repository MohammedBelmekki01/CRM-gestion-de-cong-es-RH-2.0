"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    function scatter() {
      anime({
        targets: ".bg-shape",
        translateX: () => anime.random(-600, 600),
        translateY: () => anime.random(-350, 350),
        rotate: () => anime.random(0, 360),
        scale: () => anime.random(3, 12) / 10,
        duration: 4500,
        easing: "easeInOutQuad",
        complete: scatter,
      });
    }

    if (containerRef.current) {
      containerRef.current.querySelectorAll(".bg-shape").forEach((el) => {
        const h = el as HTMLElement;
        h.style.transform = `translate(${anime.random(-600, 600)}px, ${anime.random(-350, 350)}px) rotate(${anime.random(0, 360)}deg) scale(${anime.random(3, 12) / 10})`;
      });
    }

    scatter();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`sq-${i}`}
          className="bg-shape absolute top-1/2 left-1/2 w-12 h-12 rounded-sm opacity-[0.12]"
          style={{ background: "linear-gradient(135deg, #1e293b, #475569)" }}
        />
      ))}

      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`ci-${i}`}
          className="bg-shape absolute top-1/2 left-1/2 w-12 h-12 rounded-full opacity-[0.15]"
          style={{ background: "#334155" }}
        />
      ))}

      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`tr-${i}`}
          className="bg-shape absolute top-1/2 left-1/2 w-12 h-12 opacity-[0.10]"
          style={{
            background: "#94a3b8",
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
          }}
        />
      ))}
    </div>
  );
}
