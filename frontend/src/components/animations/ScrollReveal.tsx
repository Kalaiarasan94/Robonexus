"use client";

import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
}

export default function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  duration = 0.6,
}: ScrollRevealProps) {
  // A "left"/"right" reveal parks the element 40px to the side until it scrolls
  // into view. On a phone that sticks out past the viewport and makes the page
  // wider than the screen, so below `md` we reveal vertically instead — same
  // effect, no sideways travel.
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  const offset = isNarrow ? { x: 0, y: 24 } : directions[direction];

  return (
    <motion.div
      // framer-motion only reads `initial` when the element mounts, so the
      // keyed remount is what lets the breakpoint switch above actually take
      // effect after hydration instead of keeping the desktop x-offset.
      key={isNarrow ? "narrow" : "wide"}
      initial={{
        opacity: 0,
        ...offset,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
    >
      {children}
    </motion.div>
  );
}
