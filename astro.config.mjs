import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://stylewth.github.io',
  output: 'static',
  image: {
    responsiveStyles: true,
  },
  integrations: [sitemap()],
});
