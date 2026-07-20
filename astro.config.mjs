// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import rehypeMermaid from 'rehype-mermaid';

// https://astro.build/config
export default defineConfig({
  markdown: {
    syntaxHighlight: false,
    processor: unified({
      rehypePlugins: [
        [
          rehypeMermaid,
          {
            strategy: 'inline-svg',
            launchOptions: {
              channel: 'chrome',
              args: ['--no-sandbox'],
            },
            mermaidConfig: {
              theme: 'base',
              themeVariables: {
                fontFamily: 'Arial, sans-serif',
                primaryColor: '#eef2ff',
                primaryBorderColor: '#3457d5',
                primaryTextColor: '#1d2433',
                lineColor: '#657084',
              },
            },
          },
        ],
      ],
    }),
  },
  integrations: [mdx()],
});
