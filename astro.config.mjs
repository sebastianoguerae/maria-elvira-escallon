// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://sebastianoguerae.github.io',
  base: '/maria-elvira-escallon',
  integrations: [
    react(),
    sitemap({
      // Exclude the root noindex redirect stub from the sitemap
      filter: (page) => page !== 'https://sebastianoguerae.github.io/maria-elvira-escallon/',
    }),
  ],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'fr', 'zh'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
