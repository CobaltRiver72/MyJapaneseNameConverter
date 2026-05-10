import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://myjapanesenametranslator.com',
  output: 'static',
  compressHTML: false,
  build: {
    format: 'file',
  },
  trailingSlash: 'never',
});
