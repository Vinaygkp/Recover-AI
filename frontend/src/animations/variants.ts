export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }
};

export const slideUp = {
  initial: { opacity: 0, y: 25 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -25 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
};

export const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export const scaleIn = {
  initial: { scale: 0.92, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 300, damping: 25 } 
  }
};

export const countUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

// Premium Extra Variants for Interactive Cards & Neon Glows
export const hoverScale = {
  whileHover: { scale: 1.02, transition: { duration: 0.2, ease: "easeInOut" } },
  whileTap: { scale: 0.98 }
};

export const glowPulse = {
  animate: {
    opacity: [0.4, 0.8, 0.4],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
  }
};