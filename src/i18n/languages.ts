export const languages = {
  es: { label: 'Español', code: 'es', dir: 'ltr' },
  en: { label: 'English', code: 'en', dir: 'ltr' },
  fr: { label: 'Français', code: 'fr', dir: 'ltr' },
  zh: { label: '中文', code: 'zh', dir: 'ltr' },
} as const;

export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'en';
export const supportedLangs = Object.keys(languages) as Lang[];
