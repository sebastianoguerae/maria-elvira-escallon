import { ui, type UIKey } from './ui';
import { defaultLang, type Lang, supportedLangs } from './languages';

export function t(lang: Lang, key: UIKey): string {
  return ui[lang]?.[key] ?? ui[defaultLang][key];
}

export function getLangFromUrl(url: URL): Lang {
  const [, langSegment] = url.pathname.split('/');
  if (supportedLangs.includes(langSegment as Lang)) {
    return langSegment as Lang;
  }
  return defaultLang;
}

/**
 * Route existence matrix.
 * `paths` only lists languages where the equivalent page actually exists
 * (verified against src/pages/{es,en,fr,zh}/). ES is content-canonical.
 * `detailLangs` lists languages that have individual detail pages under
 * the section (other languages only have the section index, if any).
 */
interface RouteInfo {
  paths: Partial<Record<Lang, string>>;
  detailLangs?: Lang[];
}

/** Map of equivalent routes across languages, keyed by the ES path */
const routeMap: Record<string, RouteInfo> = {
  '/': { paths: { es: '/', en: '/', fr: '/', zh: '/' } },
  '/obra/': {
    paths: { es: '/obra/', en: '/works/', fr: '/oeuvres/', zh: '/zuopin/' },
    detailLangs: ['es', 'en'],
  },
  '/biografia/': { paths: { es: '/biografia/', en: '/biography/', fr: '/biographie/', zh: '/zhuanji/' } },
  '/exposiciones/': {
    paths: { es: '/exposiciones/', en: '/exhibitions/', fr: '/expositions/', zh: '/zhanlan/' },
    detailLangs: ['es'],
  },
  '/linea-de-tiempo/': { paths: { es: '/linea-de-tiempo/', en: '/timeline/', fr: '/chronologie/', zh: '/shijianxian/' } },
  '/mapa/': { paths: { es: '/mapa/', en: '/map/', fr: '/carte/', zh: '/ditu/' } },
  '/prensa/': { paths: { es: '/prensa/' } },
  '/contacto/': { paths: { es: '/contacto/' } },
  '/textos/': { paths: { es: '/textos/', en: '/texts/' }, detailLangs: ['es'] },
  '/publicaciones/': { paths: { es: '/publicaciones/', en: '/publications/' }, detailLangs: ['es'] },
  '/voz-del-artista/': { paths: { es: '/voz-del-artista/', en: '/artist-statement/' } },
};

function getBase(): string {
  return import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
}

export function getLocalizedPath(lang: Lang, basePath: string): string {
  const base = getBase();
  const mapped = routeMap[basePath];
  if (mapped) {
    const langPath = mapped.paths[lang];
    if (langPath) return `${base}/${lang}${langPath}`;
    // Page doesn't exist in this language: link to the ES (canonical) version
    return `${base}/es${mapped.paths.es}`;
  }
  return `${base}/${lang}${basePath}`;
}

interface ParsedPath {
  lang: Lang;
  path: string;
}

function parsePathname(pathname: string): ParsedPath | null {
  const base = getBase();
  const pathWithoutBase = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const match = pathWithoutBase.match(/^\/(es|en|fr|zh)(\/.*)?$/);
  if (!match) return null;
  return { lang: match[1] as Lang, path: match[2] || '/' };
}

interface MatchedRoute {
  info: RouteInfo;
  /** Sub-path after the section prefix ('' for the section index itself) */
  remainder: string;
}

function matchRoute(lang: Lang, path: string): MatchedRoute | null {
  // Match the longest route prefix first; '/' only matches exactly,
  // otherwise it would swallow every path.
  const entries = Object.values(routeMap)
    .filter((info) => info.paths[lang] !== undefined)
    .sort((a, b) => (b.paths[lang] as string).length - (a.paths[lang] as string).length);

  for (const info of entries) {
    const langPath = info.paths[lang] as string;
    if (langPath === '/') {
      if (path === '/') return { info, remainder: '' };
      continue;
    }
    if (path === langPath || path.startsWith(langPath)) {
      const remainder = path.slice(langPath.length);
      return { info, remainder: remainder === '/' ? '' : remainder };
    }
  }
  return null;
}

/** Get the equivalent URL in another language from a full pathname */
export function switchLanguage(currentPathname: string, targetLang: Lang): string {
  const base = getBase();
  const parsed = parsePathname(currentPathname);
  if (!parsed) return `${base}/${targetLang}/`;

  const matched = matchRoute(parsed.lang, parsed.path);
  if (!matched) return `${base}/${targetLang}/`;

  const { info, remainder } = matched;
  const targetPath = info.paths[targetLang];
  // Page doesn't exist at all in the target language: go to its home page
  if (!targetPath) return `${base}/${targetLang}/`;

  // Detail page, but target language only has the section index
  if (remainder && info.detailLangs && !info.detailLangs.includes(targetLang)) {
    return `${base}/${targetLang}${targetPath}`;
  }

  return `${base}/${targetLang}${targetPath}${remainder}`;
}

/**
 * hreflang alternates for a pathname: only languages where the SAME content
 * actually exists (no home/index fallbacks). Returns [] when the page has no
 * real alternates (fewer than 2 languages), since a lone self-referencing
 * hreflang is meaningless.
 */
export function getAlternates(pathname: string): { lang: Lang; url: string }[] {
  const base = getBase();
  const parsed = parsePathname(pathname);
  if (!parsed) return [];

  const matched = matchRoute(parsed.lang, parsed.path);
  if (!matched) return [];

  const { info, remainder } = matched;
  const alternates: { lang: Lang; url: string }[] = [];
  for (const lang of supportedLangs) {
    const langPath = info.paths[lang];
    if (!langPath) continue;
    // Detail pages only exist in the languages listed in detailLangs
    if (remainder && info.detailLangs && !info.detailLangs.includes(lang)) continue;
    alternates.push({ lang, url: `${base}/${lang}${langPath}${remainder}` });
  }
  return alternates.length > 1 ? alternates : [];
}
