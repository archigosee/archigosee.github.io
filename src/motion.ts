// Shared mutable state written by GSAP/pointer handlers and read inside the
// R3F render loop. Plain object on purpose: no React re-renders on scroll.
export const motion = {
  pointer: { x: 0, y: 0, active: false },
  heroOut: 0, // 0 in hero → 1 once the hero has scrolled away
  explode: 0, // 0 cluster → 1 layered architecture
  exit: 0, // 0 → 1 as projects come in; the network recedes
}

const mq = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches

export const device = {
  mobile: mq('(max-width: 820px)') || mq('(pointer: coarse)'),
  reducedMotion: mq('(prefers-reduced-motion: reduce)'),
  lowPower: typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4,
}
