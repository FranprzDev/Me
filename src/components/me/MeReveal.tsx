"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Fades and lifts its children into place the first time they enter the
 * viewport. Pure CSS transition driven by one IntersectionObserver.
 */
export function MeReveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const style = { "--me-delay": `${delay}ms` } as CSSProperties;

  return (
    <Tag
      ref={ref as never}
      className={`me-reveal ${visible ? "is-in" : ""} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
