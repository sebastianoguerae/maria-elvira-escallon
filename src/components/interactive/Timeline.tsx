import { useEffect, useRef, useState, useCallback } from 'react';
import timelineData from '../../content/timeline/events.json';

/* ------------------------------------------------
   Types
   ------------------------------------------------ */
interface WorkEvent {
  year: number;
  title: string;
  type: 'work' | 'award' | 'exhibition';
  slug: string | null;
  desc?: string;
}

interface ContextEvent {
  year: number;
  title: string;
  desc: string;
  related?: string;
}

/* ------------------------------------------------
   i18n labels
   ------------------------------------------------ */
const i18n: Record<string, Record<string, string>> = {
  es: {
    works: 'Obras', context: 'Contexto',
    work: 'OBRA', award: 'PREMIO', exhibition: 'EXPOSICIÓN',
    clickToView: 'Click para ver obra →',
    legendWork: 'Obra', legendAward: 'Premio', legendExhibition: 'Exposición',
    legendContext: 'Contexto histórico',
  },
  en: {
    works: 'Works', context: 'Context',
    work: 'WORK', award: 'AWARD', exhibition: 'EXHIBITION',
    clickToView: 'Click to view work →',
    legendWork: 'Work', legendAward: 'Award', legendExhibition: 'Exhibition',
    legendContext: 'Historical context',
  },
  fr: {
    works: 'Œuvres', context: 'Contexte',
    work: 'ŒUVRE', award: 'PRIX', exhibition: 'EXPOSITION',
    clickToView: 'Cliquer pour voir l\'œuvre →',
    legendWork: 'Œuvre', legendAward: 'Prix', legendExhibition: 'Exposition',
    legendContext: 'Contexte historique',
  },
  zh: {
    works: '作品', context: '背景',
    work: '作品', award: '奖项', exhibition: '展览',
    clickToView: '点击查看作品 →',
    legendWork: '作品', legendAward: '奖项', legendExhibition: '展览',
    legendContext: '历史背景',
  },
};

const worksPrefix: Record<string, string> = {
  es: 'obra', en: 'works', fr: 'oeuvres', zh: 'zuopin',
};

/* ------------------------------------------------
   Constants — design tokens matching global.css
   ------------------------------------------------ */
const INK = '#111111';
const INK_SOFT = '#2A2A2A';
const ASH = '#6B6560';
const ASH_LIGHT = '#9A948E';
const MOSS = '#3A3D35';
const PAPER = '#F2EDE8';
const PAPER_DARK = '#E8E2DA';
const WHITE = '#FAF8F5';

const START_YEAR = 1993;
const END_YEAR = 2024;
const YEAR_WIDTH = 130; // px per year
const PADDING_LEFT = 80;
const PADDING_RIGHT = 80;
const TOTAL_WIDTH = PADDING_LEFT + (END_YEAR - START_YEAR) * YEAR_WIDTH + PADDING_RIGHT;
const AXIS_Y = 280; // vertical position of the center line
const TOP_TRACK_BASE = 60; // top of work track area
const BOTTOM_TRACK_BASE = AXIS_Y + 40; // top of context track area
const TOTAL_HEIGHT = 520;

/* ------------------------------------------------
   Helpers
   ------------------------------------------------ */
function yearToX(year: number): number {
  return PADDING_LEFT + (year - START_YEAR) * YEAR_WIDTH;
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'work': return INK;
    case 'award': return MOSS;
    case 'exhibition': return ASH;
    default: return ASH_LIGHT;
  }
}

function getTypeLabel(type: string, lang: string): string {
  const labels = i18n[lang] || i18n.es;
  return labels[type] || '';
}

/* ------------------------------------------------
   Distribute events vertically to avoid overlap.
   Groups events by year, then staggers them within
   the available vertical space.
   ------------------------------------------------ */
interface PositionedWork extends WorkEvent {
  x: number;
  y: number;
}

interface PositionedContext extends ContextEvent {
  x: number;
  y: number;
}

function positionWorks(works: WorkEvent[]): PositionedWork[] {
  // Group by year
  const byYear: Record<number, WorkEvent[]> = {};
  works.forEach(w => {
    if (!byYear[w.year]) byYear[w.year] = [];
    byYear[w.year].push(w);
  });

  const result: PositionedWork[] = [];
  Object.entries(byYear).forEach(([, events]) => {
    const count = events.length;
    events.forEach((ev, i) => {
      const spacing = Math.min(50, (AXIS_Y - TOP_TRACK_BASE - 40) / Math.max(count, 1));
      const y = AXIS_Y - 40 - i * spacing;
      result.push({ ...ev, x: yearToX(ev.year), y });
    });
  });

  return result;
}

function positionContexts(contexts: ContextEvent[]): PositionedContext[] {
  const byYear: Record<number, ContextEvent[]> = {};
  contexts.forEach(c => {
    if (!byYear[c.year]) byYear[c.year] = [];
    byYear[c.year].push(c);
  });

  const result: PositionedContext[] = [];
  Object.entries(byYear).forEach(([, events]) => {
    const count = events.length;
    events.forEach((ev, i) => {
      const spacing = Math.min(40, 120 / Math.max(count, 1));
      const y = BOTTOM_TRACK_BASE + 20 + i * spacing;
      result.push({ ...ev, x: yearToX(ev.year), y });
    });
  });

  return result;
}

/* ------------------------------------------------
   Tooltip component
   ------------------------------------------------ */
interface TooltipData {
  x: number;
  y: number;
  title: string;
  desc?: string;
  type?: string;
  slug?: string | null;
}

function Tooltip({ data, scrollLeft, lang }: { data: TooltipData | null; scrollLeft: number; lang: string }) {
  if (!data) return null;

  const tooltipX = data.x - scrollLeft;
  const tooltipY = data.y;
  const flipLeft = tooltipX > (typeof window !== 'undefined' ? window.innerWidth - 280 : 600);

  return (
    <div
      style={{
        position: 'absolute',
        left: flipLeft ? tooltipX - 220 : tooltipX + 16,
        top: tooltipY - 10,
        width: 220,
        padding: '12px 14px',
        background: WHITE,
        border: `1px solid ${INK}`,
        fontFamily: "'Space Mono', 'Courier New', monospace",
        fontSize: '0.7rem',
        lineHeight: '1.5',
        color: INK_SOFT,
        zIndex: 100,
        pointerEvents: 'none',
        boxShadow: '2px 2px 0 rgba(0,0,0,0.06)',
      }}
    >
      {data.type && (
        <div style={{
          fontSize: '0.55rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          color: getTypeColor(data.type),
          marginBottom: 4,
        }}>
          {getTypeLabel(data.type, lang)}
        </div>
      )}
      <div style={{ fontWeight: 700, color: INK, marginBottom: data.desc ? 6 : 0 }}>
        {data.title}
      </div>
      {data.desc && (
        <div style={{ color: ASH }}>{data.desc}</div>
      )}
      {data.slug && (
        <div style={{
          marginTop: 8,
          fontSize: '0.6rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: ASH_LIGHT,
        }}>
          {(i18n[lang] || i18n.es).clickToView}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------
   Main Timeline component
   ------------------------------------------------ */
export default function Timeline({ lang = 'es' }: { lang?: string }) {
  const labels = i18n[lang] || i18n.es;
  const base = '/maria-elvira-escallon';
  const prefix = worksPrefix[lang] || 'obra';

  const scrollRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleSet, setVisibleSet] = useState<Set<number>>(new Set());
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });

  const works = positionWorks(timelineData.works as WorkEvent[]);
  const contexts = positionContexts(timelineData.context as ContextEvent[]);

  // Build a map from slug -> work position for connection lines
  const slugToWork: Record<string, PositionedWork> = {};
  works.forEach(w => {
    if (w.slug) slugToWork[w.slug] = w;
  });

  // All years with events
  const allYears: number[] = [];
  for (let y = START_YEAR; y <= END_YEAR; y++) {
    allYears.push(y);
  }

  // ------- Intersection Observer for fade-in -------
  useEffect(() => {
    const nodes = nodesRef.current.filter(Boolean) as HTMLDivElement[];
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleSet(prev => {
          const next = new Set(prev);
          entries.forEach(entry => {
            const idx = parseInt(entry.target.getAttribute('data-idx') || '-1', 10);
            if (idx >= 0 && entry.isIntersecting) {
              next.add(idx);
            }
          });
          return next;
        });
      },
      {
        root: scrollRef.current,
        rootMargin: '0px 0px 0px 0px',
        threshold: 0.1,
      }
    );

    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, [works.length, contexts.length]);

  // ------- Scroll tracking for tooltip positioning -------
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollLeft(scrollRef.current.scrollLeft);
    }
  }, []);

  // ------- Mouse drag to scroll -------
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      scrollLeft: scrollRef.current.scrollLeft,
    };
    scrollRef.current.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    scrollRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  }, []);

  // Assign indices for intersection observer
  let nodeIdx = 0;

  return (
    <div style={{ position: 'relative' }}>
      {/* Tooltip rendered outside the scroll container */}
      <Tooltip data={tooltip} scrollLeft={scrollLeft} lang={lang} />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setTooltip(null);
        }}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          width: '100%',
          cursor: 'grab',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: `${ASH_LIGHT} ${PAPER_DARK}`,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: TOTAL_WIDTH,
            height: TOTAL_HEIGHT,
            minWidth: TOTAL_WIDTH,
          }}
        >
          {/* ===== Track labels ===== */}
          <div style={{
            position: 'absolute',
            left: 16,
            top: TOP_TRACK_BASE - 4,
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.55rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: ASH_LIGHT,
            writingMode: 'vertical-rl' as const,
            transform: 'rotate(180deg)',
          }}>
            {labels.works}
          </div>

          <div style={{
            position: 'absolute',
            left: 16,
            top: BOTTOM_TRACK_BASE + 10,
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.55rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: ASH_LIGHT,
            writingMode: 'vertical-rl' as const,
            transform: 'rotate(180deg)',
          }}>
            {labels.context}
          </div>

          {/* ===== Horizontal axis ===== */}
          <div style={{
            position: 'absolute',
            left: PADDING_LEFT - 20,
            top: AXIS_Y,
            width: TOTAL_WIDTH - PADDING_LEFT - PADDING_RIGHT + 40,
            height: 1,
            background: INK,
          }} />

          {/* ===== Year ticks and labels ===== */}
          {allYears.map(year => {
            const x = yearToX(year);
            const hasEvent = works.some(w => w.year === year) || contexts.some(c => c.year === year);
            return (
              <div key={`year-${year}`}>
                {/* Tick mark */}
                <div style={{
                  position: 'absolute',
                  left: x,
                  top: hasEvent ? AXIS_Y - 8 : AXIS_Y - 4,
                  width: 1,
                  height: hasEvent ? 16 : 8,
                  background: hasEvent ? INK : ASH_LIGHT,
                }} />
                {/* Year label */}
                <div style={{
                  position: 'absolute',
                  left: x,
                  top: AXIS_Y + 12,
                  transform: 'translateX(-50%)',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.6rem',
                  color: hasEvent ? ASH : ASH_LIGHT,
                  letterSpacing: '0.03em',
                  userSelect: 'none',
                }}>
                  {year}
                </div>
              </div>
            );
          })}

          {/* ===== Connection lines (context -> work) ===== */}
          {contexts.map((ctx, i) => {
            if (!ctx.related || !slugToWork[ctx.related]) return null;
            const work = slugToWork[ctx.related];
            return (
              <svg
                key={`conn-${i}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: TOTAL_WIDTH,
                  height: TOTAL_HEIGHT,
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}
              >
                <line
                  x1={ctx.x}
                  y1={ctx.y}
                  x2={work.x}
                  y2={work.y + 10}
                  stroke={ASH_LIGHT}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
              </svg>
            );
          })}

          {/* ===== Work nodes (top track) ===== */}
          {works.map((work, i) => {
            const idx = nodeIdx++;
            const isVisible = visibleSet.has(idx);
            const color = getTypeColor(work.type);
            const isClickable = work.slug != null;
            const nodeSize = work.type === 'work' ? 10 : 7;

            return (
              <div
                key={`work-${i}`}
                ref={el => { nodesRef.current[idx] = el; }}
                data-idx={idx}
                style={{
                  position: 'absolute',
                  left: work.x,
                  top: work.y,
                  transform: `translate(-50%, -50%) ${isVisible ? 'scale(1)' : 'scale(0)'}`,
                  opacity: isVisible ? 1 : 0,
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                  transitionDelay: `${(i % 5) * 60}ms`,
                  cursor: isClickable ? 'pointer' : 'default',
                  textAlign: 'center',
                  zIndex: 10,
                }}
                onMouseEnter={() => setTooltip({
                  x: work.x,
                  y: work.y,
                  title: work.title,
                  desc: work.desc,
                  type: work.type,
                  slug: work.slug,
                })}
                onMouseLeave={() => setTooltip(null)}
                onClick={(e) => {
                  if (isClickable && !isDragging) {
                    e.preventDefault();
                    window.location.href = `${base}/${lang}/${prefix}/${work.slug}/`;
                  }
                }}
              >
                {/* Stem line from node to axis */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 1,
                  height: AXIS_Y - work.y,
                  background: `linear-gradient(to bottom, ${color}, transparent)`,
                  opacity: 0.2,
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
                }} />

                {/* Circle node */}
                <div style={{
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: '50%',
                  background: color,
                  margin: '0 auto',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'transform 0.2s ease',
                }} />

                {/* Title label */}
                <div style={{
                  position: 'absolute',
                  bottom: nodeSize / 2 + 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'normal',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.6rem',
                  fontWeight: work.type === 'award' ? 700 : 400,
                  color: color,
                  letterSpacing: '0.02em',
                  lineHeight: '1.4',
                  width: 140,
                  textAlign: 'center' as const,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}>
                  {work.title}
                </div>
              </div>
            );
          })}

          {/* ===== Context nodes (bottom track) ===== */}
          {contexts.map((ctx, i) => {
            const idx = nodeIdx++;
            const isVisible = visibleSet.has(idx);

            return (
              <div
                key={`ctx-${i}`}
                ref={el => { nodesRef.current[idx] = el; }}
                data-idx={idx}
                style={{
                  position: 'absolute',
                  left: ctx.x,
                  top: ctx.y,
                  transform: `translate(-50%, 0) ${isVisible ? 'translateY(0)' : 'translateY(10px)'}`,
                  opacity: isVisible ? 1 : 0,
                  transition: 'opacity 0.6s ease, transform 0.6s ease',
                  transitionDelay: `${(i % 4) * 80}ms`,
                  textAlign: 'center',
                  zIndex: 10,
                }}
                onMouseEnter={() => setTooltip({
                  x: ctx.x,
                  y: ctx.y,
                  title: ctx.title,
                  desc: ctx.desc,
                })}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Stem line from axis down to node */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '100%',
                  width: 1,
                  height: ctx.y - AXIS_Y,
                  background: `linear-gradient(to top, ${ASH_LIGHT}, transparent)`,
                  opacity: 0.15,
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
                }} />

                {/* Small diamond node */}
                <div style={{
                  width: 6,
                  height: 6,
                  background: ASH_LIGHT,
                  transform: 'rotate(45deg)',
                  margin: '0 auto 6px',
                  position: 'relative',
                  zIndex: 2,
                }} />

                {/* Title */}
                <div style={{
                  whiteSpace: 'normal',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.55rem',
                  color: ASH_LIGHT,
                  letterSpacing: '0.02em',
                  width: 130,
                  textAlign: 'center' as const,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}>
                  {ctx.title}
                </div>

                {/* Description */}
                {ctx.desc && (
                  <div style={{
                    whiteSpace: 'normal',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.45rem',
                    color: ASH_LIGHT,
                    opacity: 0.7,
                    width: 130,
                    textAlign: 'center' as const,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    userSelect: 'none',
                    marginTop: 2,
                    pointerEvents: 'none',
                  }}>
                    {ctx.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Legend ===== */}
      <div style={{
        display: 'flex',
        gap: 24,
        justifyContent: 'center',
        marginTop: 24,
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.6rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color: ASH,
        flexWrap: 'wrap' as const,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: INK, display: 'inline-block' }} />
          {labels.legendWork}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: MOSS, display: 'inline-block' }} />
          {labels.legendAward}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ASH, display: 'inline-block' }} />
          {labels.legendExhibition}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, background: ASH_LIGHT, display: 'inline-block', transform: 'rotate(45deg)' }} />
          {labels.legendContext}
        </span>
      </div>
    </div>
  );
}
