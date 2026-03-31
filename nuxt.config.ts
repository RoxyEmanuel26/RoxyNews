// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxt/image',
    'nuxt-simple-sitemap',
  ],

  app: {
    head: {
      title: 'NewsAggregator — Your Smart News Feed',
      htmlAttrs: { lang: 'en', class: 'dark' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'NewsAggregator brings you the latest news from multiple trusted sources, powered by smart API rotation technology.',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'NewsAggregator — Your Smart News Feed' },
        {
          property: 'og:description',
          content:
            'Stay informed with curated news from 4 trusted sources, automatically aggregated and deduplicated.',
        },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
        },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    worldnewsApiKey: process.env.WORLDNEWS_API_KEY || '',
    newsdataApiKey: process.env.NEWSDATA_API_KEY || '',
    newsapiOrgKey: process.env.NEWSAPI_ORG_KEY || '',
    thenewsApiKey: process.env.THENEWS_API_KEY || '',
    tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || '',
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || '',
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'NewsAggregator',
    },
  },

  shadcn: {
    prefix: '',
    componentDir: './components/ui',
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },

  image: {
    quality: 80,
    formats: ['webp', 'avif'],
  },

  tailwindcss: {
    configPath: 'tailwind.config.ts',
    cssPath: '~/assets/css/tailwind.css',
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
