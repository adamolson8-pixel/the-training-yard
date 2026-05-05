// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxtjs/supabase',
  ],

  runtimeConfig: {
    smtpHost: process.env.SMTP_HOST || 'smtp.zoho.com',
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
    smtpUser: process.env.SMTP_USER || 'info@trainingyarddsm.com',
    smtpPass: process.env.SMTP_PASS || '',
  },

  googleFonts: {
    families: {
      'Inter': [300, 400, 500, 600, 700, 800],
      'Outfit': [400, 500, 600, 700, 800],
    },
    display: 'swap',
    preload: true,
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'The Training Yard | Indoor Sports Facility | Des Moines, IA',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'The Training Yard is Des Moines\' premier 6,000 sq ft indoor sports facility featuring 4 batting cages, full synthetic turf, and multi-sport training for baseball, softball, soccer, and agility. Book online today.',
        },
        { name: 'author', content: 'The Training Yard' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'The Training Yard' },
        { property: 'og:title', content: 'The Training Yard | Indoor Sports Facility | Des Moines, IA' },
        {
          property: 'og:description',
          content: 'Des Moines\' premier indoor training facility. 4 batting cages, 60x100 turf, baseball, softball, soccer & agility training. Memberships starting at $89/mo.',
        },
        { property: 'og:url', content: 'https://trainingyarddsm.com' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://trainingyarddsm.com' },
      ],
    },
  },

  routeRules: {
    '/': { prerender: true },
    '/facility': { prerender: true },
    '/training': { prerender: true },
    '/resources': { prerender: true },
    '/resources/indoor-hitting-drill-tee-work-progressions': { prerender: true },
    '/resources/winter-practice-plan-youth-teams': { prerender: true },
    '/resources/soccer-footwork-ladder-drills-for-speed': { prerender: true },
    '/resources/softball-pitching-warm-up-routine': { prerender: true },
    '/resources/agility-cone-drills-multi-sport-athletes': { prerender: true },
    '/resources/coaching-101-managing-indoor-practice-time': { prerender: true },
    '/about': { prerender: true },
    '/login': { prerender: true },
    '/confirm': { prerender: true },
  },

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/about', '/facility', '/training', '/resources', '/resources/*', '/api/*'],
    }
  }
})
