import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import business from './src/data/business.json' with { type: 'json' };

export default defineConfig({
  site: business.url,
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // External files only, so the Content Security Policy can forbid inline code.
    inlineStylesheets: 'never',
  },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
