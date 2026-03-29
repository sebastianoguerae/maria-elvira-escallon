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

export function getLocalizedUrl(lang: Lang, path: string): string {
  return `/${lang}${path.startsWith('/') ? path : '/' + path}`;
}

/** Get the path prefix for works section per language */
export function getWorksPrefix(lang: Lang): string {
  const prefixes: Record<Lang, string> = {
    es: 'obra',
    en: 'works',
    fr: 'oeuvres',
    zh: 'zuopin',
  };
  return prefixes[lang];
}

export function getExhibitionsPrefix(lang: Lang): string {
  const prefixes: Record<Lang, string> = {
    es: 'exposiciones',
    en: 'exhibitions',
    fr: 'expositions',
    zh: 'zhanlan',
  };
  return prefixes[lang];
}

/** Map of equivalent routes across languages */
const routeMap: Record<string, Record<Lang, string>> = {
  '/': { es: '/', en: '/', fr: '/', zh: '/' },
  '/obra/': { es: '/obra/', en: '/works/', fr: '/oeuvres/', zh: '/zuopin/' },
  '/biografia/': { es: '/biografia/', en: '/biography/', fr: '/biographie/', zh: '/zhuanji/' },
  '/exposiciones/': { es: '/exposiciones/', en: '/exhibitions/', fr: '/expositions/', zh: '/zhanlan/' },
  '/linea-de-tiempo/': { es: '/linea-de-tiempo/', en: '/timeline/', fr: '/chronologie/', zh: '/shijianxian/' },
  '/mapa/': { es: '/mapa/', en: '/map/', fr: '/carte/', zh: '/ditu/' },
  '/prensa/': { es: '/prensa/', en: '/prensa/', fr: '/prensa/', zh: '/prensa/' },
  '/contacto/': { es: '/contacto/', en: '/contacto/', fr: '/contacto/', zh: '/contacto/' },
  '/textos/': { es: '/textos/', en: '/textos/', fr: '/textos/', zh: '/textos/' },
  '/publicaciones/': { es: '/publicaciones/', en: '/publicaciones/', fr: '/publicaciones/', zh: '/publicaciones/' },
};

export function getLocalizedPath(lang: Lang, basePath: string): string {
  const mapped = routeMap[basePath];
  if (mapped) return `/${lang}${mapped[lang]}`;
  return `/${lang}${basePath}`;
}

/** Get the equivalent URL in another language from a full pathname */
export function switchLanguage(currentPathname: string, targetLang: Lang): string {
  // Extract current lang and path
  const match = currentPathname.match(/^\/(es|en|fr|zh)(\/.*)?$/);
  if (!match) return `/${targetLang}/`;

  const currentLang = match[1] as Lang;
  const currentPath = match[2] || '/';

  // Try to find the base route in the route map
  for (const [baseRoute, langMap] of Object.entries(routeMap)) {
    if (currentPath === langMap[currentLang] || currentPath.startsWith(langMap[currentLang])) {
      const remainder = currentPath.slice(langMap[currentLang].length);
      return `/${targetLang}${langMap[targetLang]}${remainder}`;
    }
  }

  // Fallback: just swap the language prefix
  return `/${targetLang}${currentPath}`;
}
