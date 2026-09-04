import { defineConfig } from 'astro/config';
import pagefind from 'astro-pagefind';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';


const siteConfig = JSON.parse(readFileSync(new URL('./site.config.json', import.meta.url), 'utf-8'));

const origin = siteConfig.url.replace(new RegExp(`${siteConfig.basePath}$`), '');

export default defineConfig({
  site: origin,
  base: siteConfig.basePath,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [pagefind(), sitemap()],
});