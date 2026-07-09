// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mariaelviraescallon.org',
  integrations: [
    react(),
    sitemap({
      // Exclude the root noindex redirect stub from the sitemap
      filter: (page) => page !== 'https://mariaelviraescallon.org/',
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
