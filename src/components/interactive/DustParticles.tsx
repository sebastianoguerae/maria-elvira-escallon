import { useEffect, useRef, useCallback } from 'react';

interface DustParticlesProps {
  intensity?: number; // 0–1, controls particle count. Default 0.5
}

interface Particle {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  opacity: number;
  driftX: number;
  driftY: number;
  phase: number; // radians, for Brownian wobble
  phaseSpeed: number;
  life: number; // 0–1 progress through lifecycle
  lifeSpeed: number; // how fast it progresses (per ms)
}

const MIN_PARTICLES = 40;
const MAX_PARTICLES = 60;
const COLOR_R = 154; // #9A
const COLOR_G = 148; // #94
const COLOR_B = 142; // #8E
const FADE_ZONE = 0.15; // fraction of lifecycle used for fade-in / fade-out
const BROWNIAN_AMPLITUDE = 0.3; // px per frame wobble magnitude

function createParticle(w: number, h: number, startRandom = true): Particle {
  const driftAngle = Math.random() * Math.PI * 2;
  const driftSpeed = 0.05 + Math.random() * 0.15; // 0.05–0.2 px/frame

  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: 1 + Math.random() * 2, // 1–3 px
    baseOpacity: 0.15 + Math.random() * 0.15, // 0.15–0.30
    opacity: 0,
    driftX: Math.cos(driftAngle) * driftSpeed,
    driftY: Math.sin(driftAngle) * driftSpeed,
    phase: Math.random() * Math.PI * 2,
    phaseSpeed: 0.001 + Math.random() * 0.002, // radians per ms
    life: startRandom ? Math.random() : 0, // stagger initial particles
    lifeSpeed: 0.00003 + Math.random() * 0.00004, // full cycle ≈ 15–25 s
  };
}

function computeOpacity(life: number, baseOpacity: number): number {
  // Fade in during [0, FADE_ZONE], full during middle, fade out during [1-FADE_ZONE, 1]
  if (life < FADE_ZONE) {
    return baseOpacity * (life / FADE_ZONE);
  }
  if (life > 1 - FADE_ZONE) {
    return baseOpacity * ((1 - life) / FADE_ZONE);
  }
  return baseOpacity;
}

export default function DustParticles({ intensity = 0.5 }: DustParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  const targetCount = Math.round(
    MIN_PARTICLES + (MAX_PARTICLES - MIN_PARTICLES) * clampedIntensity,
  );

  // Resize handler kept in a ref so the effect can attach/detach it.
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    // --- Accessibility / performance gates ---
    if (typeof window === 'undefined') return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced) return;

    if (
      typeof navigator !== 'undefined' &&
      navigator.hardwareConcurrency != null &&
      navigator.hardwareConcurrency < 4
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initial sizing
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Seed particles
    particlesRef.current = Array.from({ length: targetCount }, () =>
      createParticle(canvas.width, canvas.height, true),
    );

    // --- Animation loop ---
    const tick = (timestamp: number) => {
      if (document.hidden) {
        // Pause while tab is not visible; reset lastTime so delta
        // doesn't spike when we come back.
        lastTimeRef.current = 0;
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const delta = Math.min(timestamp - lastTimeRef.current, 64); // cap at ~16 fps min
      lastTimeRef.current = timestamp;

      const w = canvas.width;
      const h = canvas.height;
      const frameFactor = delta / 16.667; // normalise to 60 fps

      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Advance lifecycle
        p.life += p.lifeSpeed * delta;

        if (p.life >= 1) {
          // Respawn
          particles[i] = createParticle(w, h, false);
          continue;
        }

        // Brownian wobble
        p.phase += p.phaseSpeed * delta;
        const wobbleX = Math.sin(p.phase) * BROWNIAN_AMPLITUDE * frameFactor;
        const wobbleY =
          Math.cos(p.phase * 1.3 + 1.0) * BROWNIAN_AMPLITUDE * frameFactor;

        // Move
        p.x += p.driftX * frameFactor + wobbleX;
        p.y += p.driftY * frameFactor + wobbleY;

        // Wrap around edges with a small margin so they don't pop
        const margin = p.size * 2;
        if (p.x < -margin) p.x = w + margin;
        if (p.x > w + margin) p.x = -margin;
        if (p.y < -margin) p.y = h + margin;
        if (p.y > h + margin) p.y = -margin;

        // Compute fade
        p.opacity = computeOpacity(p.life, p.baseOpacity);

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR_R},${COLOR_G},${COLOR_B},${p.opacity})`;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [targetCount, handleResize]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
