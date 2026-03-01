'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollAnimatedWrapperProps {
  children: ReactNode;
  className?: string;
  initial?: any;
  animate?: any;
  whileInView?: any;
  transition?: any;
  viewport?: any;
  style?: React.CSSProperties;
}

export function ScrollAnimatedWrapper({
  children,
  className,
  initial,
  animate,
  whileInView,
  transition,
  viewport = { once: true, margin: '-50px' },
  style,
}: ScrollAnimatedWrapperProps) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      whileInView={whileInView}
      transition={transition}
      viewport={viewport}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
