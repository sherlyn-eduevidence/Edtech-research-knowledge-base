import { defineConfig } from 'astro/config';
import pagefind from 'astro-pagefind';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// Single source of truth for site-wide metadata — see site.config.json.
const siteConfig = JSON.parse(readFileSync(new URL('./site.config.json', import.meta.url), 'utf-8'));

const origin = siteConfig.url.replace(new RegExp(`${siteConfig.basePath}$`), '');

export default defineConfig({
  site: origin,
  base: siteConfig.basePath,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [pagefind(), sitemap()],
});
