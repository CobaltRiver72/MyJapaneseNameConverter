import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://myjapanesenametranslator.com',
  output: 'static',
  build: {
    format: 'file',
  },
  trailingSlash: 'never',
});
