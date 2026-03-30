import { useState, useEffect, useRef, useCallback } from 'react';
import mapData from '../../content/timeline/map-data.json';

/* ============================================
   WorldMap — Interactive SVG-based map
   María Elvira Escallón — El Archivo
   Brutalista. Minimalista. Documental.
   ============================================ */

interface MapEvent {
  title: string;
  venue: string;
  year: number;
  type: string;
}

interface Location {
  name: string;
  country: string;
  lat: number;
  lng: number;
  type: string;
  events: MapEvent[];
}

/* ------------------------------------------------
   i18n labels
   ------------------------------------------------ */
const mapI18n: Record<string, Record<string, string>> = {
  es: {
    solo: 'INDIVIDUAL', group: 'COLECTIVA', collection: 'COLECCIÓN',
    biennial: 'BIENAL', fair: 'FERIA', site: 'SITIO',
    watermark: 'MAP-001 / PROYECCIÓN EQUIRECTANGULAR',
  },
  en: {
    solo: 'SOLO', group: 'GROUP', collection: 'COLLECTION',
    biennial: 'BIENNIAL', fair: 'FAIR', site: 'SITE',
    watermark: 'MAP-001 / EQUIRECTANGULAR PROJECTION',
  },
  fr: {
    solo: 'INDIVIDUELLE', group: 'COLLECTIVE', collection: 'COLLECTION',
    biennial: 'BIENNALE', fair: 'FOIRE', site: 'SITE',
    watermark: 'MAP-001 / PROJECTION ÉQUIRECTANGULAIRE',
  },
  zh: {
    solo: '个展', group: '群展', collection: '收藏',
    biennial: '双年展', fair: '博览会', site: '现场',
    watermark: 'MAP-001 / 等距圆柱投影',
  },
};

// Equirectangular projection: lat/lng to percentage
function toX(lng: number): number {
  return ((lng + 180) / 360) * 100;
}

function toY(lat: number): number {
  return ((90 - lat) / 180) * 100;
}

// Color by event type
function dotColor(type: string): string {
  switch (type) {
    case 'base':
      return '#111111';
    case 'collection':
      return '#3A3D35';
    case 'site':
      return '#3A3D35';
    default:
      return '#111111';
  }
}

function eventColor(type: string): string {
  switch (type) {
    case 'solo':
      return '#111111';
    case 'group':
      return '#6B6560';
    case 'collection':
      return '#3A3D35';
    case 'biennial':
      return '#111111';
    case 'fair':
      return '#6B6560';
    case 'site':
      return '#3A3D35';
    default:
      return '#6B6560';
  }
}

function eventLabel(type: string, lang: string): string {
  const labels = mapI18n[lang] || mapI18n.es;
  return labels[type] || type.toUpperCase();
}

// Continent outlines projected with equirectangular formula:
// x = ((lng + 180) / 360) * 1000, y = ((90 - lat) / 180) * 500
// viewBox 0 0 1000 500
const CONTINENT_PATHS = [
  // North America
  'M 42,83 L 139,69 244,89 344,103 325,125 294,136 278,181 258,194 233,206 175,161 161,144 158,114 Z',
  // Central America
  'M 233,206 L 258,194 281,225 250,208 Z',
  // South America
  'M 283,242 L 289,222 317,222 339,233 403,261 381,314 339,347 311,400 292,378 286,283 278,250 Z',
  // Europe
  'M 472,103 L 475,142 483,150 514,131 544,144 567,144 581,136 572,128 556,106 533,69 528,83 486,92 494,119 Z',
  // UK / Ireland
  'M 486,92 L 494,86 498,92 494,100 486,100 Z',
  'M 478,97 L 472,103 476,107 480,100 Z',
  // Africa
  'M 483,153 L 528,147 542,161 589,167 639,222 608,269 597,319 550,344 533,261 539,283 528,239 522,239 461,228 453,211 Z',
  // Russia / Northern Asia
  'M 533,69 L 556,106 572,128 581,136 622,142 644,161 689,122 722,97 875,103 972,69 875,58 722,56 622,61 Z',
  // South / Southeast Asia
  'M 644,161 L 686,181 717,228 744,189 750,189 767,206 778,228 794,225 839,164 853,147 839,164 794,225 806,269 792,256 778,228 767,206 750,189 717,228 686,181 Z',
  // India subcontinent
  'M 686,181 L 700,175 717,228 744,189 730,175 Z',
  // East Asia / China
  'M 722,97 L 750,189 767,206 794,225 839,164 853,147 875,103 Z',
  // Japan
  'M 892,131 L 878,125 872,136 864,158 876,158 892,142 Z',
  // Indonesia archipelago
  'M 792,256 L 806,269 819,247 850,260 892,264 870,270 819,270 806,275 792,263 Z',
  // Australia
  'M 856,292 L 864,283 925,328 919,344 903,356 883,347 822,339 856,292 Z',
];

export default function WorldMap({ lang = 'es' }: { lang?: string }) {
  const mapLabels = mapI18n[lang] || mapI18n.es;
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [visibleDots, setVisibleDots] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const locations: Location[] = mapData.locations;
  const bogota = locations.find((l) => l.type === 'base')!;

  // Staggered entrance animation
  useEffect(() => {
    setMounted(true);
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    locations.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisibleDots((prev) => new Set([...prev, i]));
      }, 200 + i * 50);
      timeouts.push(t);
    });
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const handleDotHover = useCallback(
    (location: Location, e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setActiveLocation(location);
      setTooltipPos({ x, y });
    },
    []
  );

  const handleDotLeave = useCallback(() => {
    setActiveLocation(null);
  }, []);

  // Dot size based on number of events
  const dotRadius = (loc: Location): number => {
    const count = loc.events.length;
    if (loc.type === 'base') return 7.8;
    if (count >= 3) return 5.85;
    if (count >= 2) return 4.55;
    return 3.25;
  };

  // Check if event is a biennial (needs ring)
  const hasBiennial = (loc: Location): boolean => {
    return loc.events.some((e) => e.type === 'biennial');
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        background: '#E8E2DA',
        borderTop: '1px solid #111',
        borderBottom: '1px solid #111',
        overflow: 'hidden',
      }}
    >
      {/* SVG map */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 500"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background grid */}
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#D5CFC7"
              strokeWidth="0.3"
            />
          </pattern>
          {/* Gradient for connection lines */}
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6B6560" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#E8E2DA" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Grid background */}
        <rect width="1000" height="500" fill="#E8E2DA" />
        <rect width="1000" height="500" fill="url(#grid)" />

        {/* Equator line */}
        <line
          x1="0"
          y1="250"
          x2="1000"
          y2="250"
          stroke="#D5CFC7"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />

        {/* Continent outlines */}
        <g>
          {CONTINENT_PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="#D5CFC7"
              stroke="#B8B2AA"
              strokeWidth="0.5"
              opacity="0.6"
            />
          ))}
        </g>

        {/* Connection lines from Bogota to each city */}
        {mounted && (
          <g>
            {locations
              .filter((l) => l.type !== 'base')
              .map((loc, i) => {
                const x1 = (toX(bogota.lng) / 100) * 1000;
                const y1 = (toY(bogota.lat) / 100) * 500;
                const x2 = (toX(loc.lng) / 100) * 1000;
                const y2 = (toY(loc.lat) / 100) * 500;

                // Curved path using quadratic bezier
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.15;

                return (
                  <path
                    key={`line-${i}`}
                    d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                    fill="none"
                    stroke="#6B6560"
                    strokeWidth="0.5"
                    strokeDasharray="3 3"
                    opacity={visibleDots.has(locations.indexOf(loc)) ? 0.35 : 0}
                    style={{
                      transition: 'opacity 0.6s ease',
                    }}
                  />
                );
              })}
          </g>
        )}

        {/* Location dots */}
        {locations.map((loc, i) => {
          const cx = (toX(loc.lng) / 100) * 1000;
          const cy = (toY(loc.lat) / 100) * 500;
          const r = dotRadius(loc);
          const isVisible = visibleDots.has(i);
          const isBase = loc.type === 'base';
          const isBiennial = hasBiennial(loc);
          const fill = dotColor(loc.type);

          return (
            <g
              key={`dot-${i}`}
              style={{
                cursor: 'pointer',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0)',
                transformOrigin: `${cx}px ${cy}px`,
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}
              onMouseEnter={(e) => handleDotHover(loc, e)}
              onMouseLeave={handleDotLeave}
              onClick={(e) => handleDotHover(loc, e)}
            >
              {/* Biennial ring */}
              {isBiennial && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 3}
                  fill="none"
                  stroke="#111"
                  strokeWidth="0.7"
                  opacity="0.5"
                />
              )}

              {/* Base pulsing rings */}
              {isBase && (
                <>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#111"
                    strokeWidth="0.5"
                    opacity="0.3"
                  >
                    <animate
                      attributeName="r"
                      from={String(r)}
                      to={String(r + 16)}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.3"
                      to="0"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#111"
                    strokeWidth="0.5"
                    opacity="0.3"
                  >
                    <animate
                      attributeName="r"
                      from={String(r)}
                      to={String(r + 16)}
                      dur="3s"
                      begin="1.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.3"
                      to="0"
                      dur="3s"
                      begin="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </>
              )}

              {/* Main dot */}
              <circle cx={cx} cy={cy} r={r} fill={fill} />

              {/* Hover highlight ring */}
              <circle
                cx={cx}
                cy={cy}
                r={r + 2}
                fill="none"
                stroke={fill}
                strokeWidth="0.8"
                opacity={activeLocation === loc ? 0.6 : 0}
                style={{ transition: 'opacity 0.2s ease' }}
              />
            </g>
          );
        })}

        {/* City name labels */}
        {mounted && (
          <g>
            {/* BOGOTA — base */}
            <text
              x={(toX(bogota.lng) / 100) * 1000 + 10}
              y={(toY(bogota.lat) / 100) * 500 + 1}
              fill="#111"
              fontSize="7"
              fontFamily="'Space Mono', monospace"
              fontWeight="700"
              letterSpacing="0.1em"
            >
              BOGOTA
            </text>
            {/* Key city labels */}
            {locations
              .filter((l) =>
                ['Londres', 'Paris', 'Sydney', 'La Habana', 'Nueva York'].includes(l.name)
              )
              .map((loc, i) => {
                const cx = (toX(loc.lng) / 100) * 1000;
                const cy = (toY(loc.lat) / 100) * 500;
                // Offset label to the right by default, left if too far right
                const offsetX = cx > 900 ? -8 : 8;
                const anchor = cx > 900 ? 'end' : 'start';
                return (
                  <text
                    key={`label-${i}`}
                    x={cx + offsetX}
                    y={cy + 2}
                    fill="#6B6560"
                    fontSize="5"
                    fontFamily="'Space Mono', monospace"
                    fontWeight="400"
                    letterSpacing="0.08em"
                    textAnchor={anchor}
                    opacity={visibleDots.has(locations.indexOf(loc)) ? 0.8 : 0}
                    style={{ transition: 'opacity 0.4s ease' }}
                  >
                    {loc.name.toUpperCase()}
                  </text>
                );
              })}
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {activeLocation && (
        <div
          style={{
            position: 'absolute',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: `translate(${
              tooltipPos.x > (containerRef.current?.offsetWidth ?? 500) / 2
                ? 'calc(-100% - 16px)'
                : '16px'
            }, -50%)`,
            background: '#FAF8F5',
            border: '1px solid #111',
            padding: '12px 16px',
            maxWidth: '280px',
            minWidth: '200px',
            zIndex: 10,
            pointerEvents: 'none',
            fontFamily: "'Space Mono', monospace",
            boxShadow: '3px 3px 0px rgba(0,0,0,0.08)',
          }}
        >
          {/* City name */}
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.12em',
              color: '#111',
              marginBottom: '4px',
            }}
          >
            {activeLocation.name}
          </div>
          <div
            style={{
              fontSize: '0.55rem',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              color: '#9A948E',
              marginBottom: '10px',
              paddingBottom: '8px',
              borderBottom: '1px solid #E8E2DA',
            }}
          >
            {activeLocation.country}
          </div>

          {/* Events list */}
          {activeLocation.events.map((evt, j) => (
            <div
              key={j}
              style={{
                marginBottom: j < activeLocation.events.length - 1 ? '8px' : 0,
                paddingBottom:
                  j < activeLocation.events.length - 1 ? '8px' : 0,
                borderBottom:
                  j < activeLocation.events.length - 1
                    ? '1px dashed #E8E2DA'
                    : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '2px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: eventColor(evt.type),
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.55rem',
                    letterSpacing: '0.08em',
                    color: eventColor(evt.type),
                    textTransform: 'uppercase' as const,
                  }}
                >
                  {eventLabel(evt.type, lang)}
                </span>
                <span
                  style={{
                    fontSize: '0.55rem',
                    color: '#9A948E',
                    marginLeft: 'auto',
                  }}
                >
                  {evt.year}
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#111',
                  lineHeight: 1.4,
                }}
              >
                {evt.title}
              </div>
              <div
                style={{
                  fontSize: '0.6rem',
                  color: '#6B6560',
                  lineHeight: 1.3,
                }}
              >
                {evt.venue}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Catalog number watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '12px',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.55rem',
          color: '#B8B2AA',
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          pointerEvents: 'none',
        }}
      >
        {mapLabels.watermark}
      </div>
    </div>
  );
}
