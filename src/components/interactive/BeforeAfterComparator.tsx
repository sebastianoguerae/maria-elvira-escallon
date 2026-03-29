import { useEffect, useRef, useState, useCallback } from 'react';

/* ------------------------------------------------
   Design tokens — matching global tokens.css
   ------------------------------------------------ */
const INK = '#111111';
const ASH = '#6B6560';
const ASH_LIGHT = '#9A948E';
const PAPER_DARK = '#E8E2DA';
const AFTER_BG = '#D5CEC5';
const MONO = "'Space Mono', 'Courier New', monospace";

/* ------------------------------------------------
   Props
   ------------------------------------------------ */
interface BeforeAfterComparatorProps {
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  title?: string;
}

/* ------------------------------------------------
   Component
   ------------------------------------------------ */
export default function BeforeAfterComparator({
  beforeImage,
  afterImage,
  beforeLabel = '2003',
  afterLabel = '2020',
  title = 'Comparador temporal',
}: BeforeAfterComparatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const animationRef = useRef<number | null>(null);

  const hasBeforeImage = Boolean(beforeImage);
  const hasAfterImage = Boolean(afterImage);

  /* ---- Intro animation on first scroll into view ---- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          observer.disconnect();

          // Animate from 20% to 50% over 1 second
          const startTime = performance.now();
          const duration = 1000;
          const from = 20;
          const to = 50;

          setSplitPosition(from);

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = from + (to - from) * eased;
            setSplitPosition(current);

            if (progress < 1) {
              animationRef.current = requestAnimationFrame(animate);
            }
          };

          animationRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasAnimated]);

  /* ---- Pointer event handlers ---- */
  const getPositionFromEvent = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return splitPosition;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = (x / rect.width) * 100;
      return Math.max(0, Math.min(100, pct));
    },
    [splitPosition]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setSplitPosition(getPositionFromEvent(e.clientX));
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [getPositionFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      setSplitPosition(getPositionFromEvent(e.clientX));
    },
    [isDragging, getPositionFromEvent]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /* ---- Render ---- */
  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Instruction label */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: '0.6rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: ASH_LIGHT,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        Desliza para comparar
      </div>

      {/* Image container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 10',
          overflow: 'hidden',
          cursor: isDragging ? 'ew-resize' : 'default',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* BEFORE layer (full width, sits behind) */}
        {hasBeforeImage ? (
          <img
            src={beforeImage}
            alt={`${title} — ${beforeLabel}`}
            draggable={false}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: PAPER_DARK,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MONO,
              fontSize: '0.7rem',
              letterSpacing: '0.06em',
              color: ASH,
              textTransform: 'uppercase' as const,
              padding: '2rem',
              textAlign: 'center' as const,
            }}
          >
            Intervenci&oacute;n reciente &mdash; 2003
          </div>
        )}

        {/* AFTER layer (clipped by splitPosition) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            clipPath: `inset(0 0 0 ${splitPosition}%)`,
            willChange: 'clip-path',
          }}
        >
          {hasAfterImage ? (
            <img
              src={afterImage}
              alt={`${title} — ${afterLabel}`}
              draggable={false}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: AFTER_BG,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize: '0.7rem',
                letterSpacing: '0.06em',
                color: ASH,
                textTransform: 'uppercase' as const,
                padding: '2rem',
                textAlign: 'center' as const,
              }}
            >
              A&ntilde;os despu&eacute;s &mdash; La corteza reclama
            </div>
          )}
        </div>

        {/* Vertical divider line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${splitPosition}%`,
            width: 1,
            height: '100%',
            background: INK,
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Drag handle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${splitPosition}%`,
            transform: 'translate(-50%, -50%)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#FAF8F5',
            border: `1px solid ${INK}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'ew-resize',
            zIndex: 3,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
          }}
        >
          {/* Arrow icons */}
          <svg
            width="18"
            height="12"
            viewBox="0 0 18 12"
            fill="none"
            style={{ pointerEvents: 'none' }}
          >
            {/* Left arrow */}
            <polyline
              points="6,1 1,6 6,11"
              stroke={INK}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Right arrow */}
            <polyline
              points="12,1 17,6 12,11"
              stroke={INK}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Year labels */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            fontFamily: MONO,
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: INK,
            background: 'rgba(242, 237, 232, 0.85)',
            padding: '4px 8px',
            zIndex: 1,
          }}
        >
          {beforeLabel}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            fontFamily: MONO,
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: INK,
            background: 'rgba(242, 237, 232, 0.85)',
            padding: '4px 8px',
            zIndex: 1,
          }}
        >
          {afterLabel}
        </div>
      </div>

      {/* Title below */}
      {title && (
        <div
          style={{
            fontFamily: MONO,
            fontSize: '0.6rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: ASH_LIGHT,
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
}
