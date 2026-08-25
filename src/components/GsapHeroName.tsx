"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function GsapHeroName({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const letters = el.querySelectorAll<HTMLElement>(".hero-letter");

      gsap.set(letters, { yPercent: 120, opacity: 0, rotateX: -80 });
      gsap.to(letters, {
        yPercent: 0,
        opacity: 1,
        rotateX: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: { each: 0.045, from: "start" },
      });

      // Aura estática sutil (sin tween de filter: repintar el filtro del
      // título cada frame era caro y generaba sensación de parpadeo).
      gsap.set(el, {
        filter:
          "drop-shadow(0 0 22px rgba(91,140,255,0.35)) drop-shadow(0 0 6px rgba(233,194,112,0.18))",
      });

      // Flotación lenta y de poca amplitud.
      gsap.to(el, {
        y: -4,
        duration: 4.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }, ref);

    return () => ctx.revert();
  }, [text]);

  const words = text.split(" ");

  return (
    <h1
      ref={ref}
      className="h-display glow-space hero-gsap-name"
      style={{ fontSize: "clamp(2.8rem, 9vw, 6.5rem)", margin: 0 }}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span key={wi} className="hero-word">
          {[...word].map((ch, ci) => (
            <span key={ci} className="hero-letter" aria-hidden="true">
              {ch}
            </span>
          ))}
          {wi < words.length - 1 && (
            <span className="hero-letter" aria-hidden="true">
              &nbsp;
            </span>
          )}
        </span>
      ))}
    </h1>
  );
}
