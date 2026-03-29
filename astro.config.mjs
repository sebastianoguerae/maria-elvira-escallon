// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://sebastianoguerae.github.io',
  base: '/maria-elvira-escallon',
  integrations: [react(), sitemap()],
  i18n: {
    defaultLocale: 'en',
    locales: ['es', 'en', 'fr', 'zh'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
