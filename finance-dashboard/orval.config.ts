import { defineConfig } from 'orval'

export default defineConfig({
  main: {
    input: {
      target: '../docs/openapi_main.yaml',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/main',
      schemas: './src/api/generated/main/model',
      client: 'fetch',
      mock: {
        type: 'msw',
        delay: 300,
        baseUrl: '/api/v1/main',
      },
      override: {
        mutator: {
          path: './src/api/custom-fetch.ts',
          name: 'mainFetch',
        },
      },
    },
  },
})
