// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    // Only use the Netlify preset in CI — prevents crash in local dev
    preset: process.env.NETLIFY ? 'netlify' : undefined,
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@netlify/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxtjs/supabase',
    '@nuxtjs/sitemap',
    'nuxt-gtag',
  ],

  // GA4. The measurement ID comes from NUXT_PUBLIC_GTAG_ID (Netlify env var,
  // production context) — never hardcoded here.
  gtag: {
    enabled: process.env.NODE_ENV === 'production',
  },

  sitemap: {
    siteUrl: 'https://trainingyarddsm.com',
  },

  runtimeConfig: {
    smtpHost: process.env.SMTP_HOST || 'smtp.zoho.com',
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
    smtpUser: '',                 // SMTP_USER / NUXT_SMTP_USER - read at runtime, never baked into the build
    smtpPass: '',                 // SMTP_PASS / NUXT_SMTP_PASS - read at runtime, never baked into the build
    // Stripe — live
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    // Stripe — test
    stripeTestSecretKey: '',
    stripeTestWebhookSecret: '',
    stripeTestMode: '',           // mapped from NUXT_STRIPE_TEST_MODE env var
    // Email
    resendApiKey: '',             // NUXT_RESEND_API_KEY
    adminEmail: '',               // NUXT_ADMIN_EMAIL — comma-separated; defaults to adam@ + jesse@heartlandroofingandsiding.com
    cronSecret: '',               // NUXT_CRON_SECRET — protects /api/cron/reminders


    public: {
      stripePublishableKey: '',
      stripeTestPublishableKey: '',
      stripeTestMode: '',           // Set NUXT_PUBLIC_STRIPE_TEST_MODE in .env for UI display
      siteUrl: '',
      zohoSignUrl: '',    // Set NUXT_PUBLIC_ZOHO_SIGN_URL in .env when ready
    },

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
        { property: 'og:image', content: 'https://trainingyarddsm.com/images/Training_Yard_Facility_homepage.jpg' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://trainingyarddsm.com/images/Training_Yard_Facility_homepage.jpg' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // Canonical URLs are set per-page via useHead() — do NOT set a global canonical
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
    '/teams': { prerender: true },
    '/privacy': { prerender: true },
    '/terms': { prerender: true },
    '/login': { prerender: true },
    '/confirm': { prerender: true },
    // Do NOT add `prerender: true` to any `ssr: false` route. Nuxt writes the
    // prerendered payload for such a route as {"data":-1}, i.e.
    // nuxtApp.payload.data === undefined on the client. Any useFetch() /
    // useAsyncData() on the page then throws "Cannot read properties of
    // undefined (reading '$f...')" during mount and the visitor gets Nuxt's
    // 500 screen. These routes are already SPA-served by the ssr:false rules.
    '/reset-password': { ssr: false },
    '/team-waiver': { ssr: false },
    '/booking-success': { ssr: false },
    '/team-success': { ssr: false },
    '/admin/bookings': { ssr: false },
    '/admin/schedule': { ssr: false },
    '/admin/blocks': { ssr: false },
    '/admin/memberships': { ssr: false },
    '/admin/payments': { ssr: false },
    '/admin/settings': { ssr: false },
    '/admin/teams': { ssr: false },
    '/admin/users': { ssr: false },
    '/admin/waivers': { ssr: false },
    '/portal/book': { ssr: false },
    '/portal/bookings': { ssr: false },
    '/portal/dashboard': { ssr: false },
    '/portal/membership': { ssr: false },
    '/portal/profile': { ssr: false },
    '/portal/team': { ssr: false },
    '/portal/waiver': { ssr: false },
    '/portal/**': { ssr: false },
    '/admin/**': { ssr: false },
  },

  supabase: {
    // Route-level auth/admin middleware waits for the persisted session. The
    // module's global redirect runs before session hydration on deep links and
    // can bounce valid users to /login.
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      // Public routes that do NOT require authentication
      // Netlify serves prerendered routes with a trailing slash. Keep both the
      // canonical path and every nested/slashed form public so hydration does
      // not bounce visitors to /login after the page first renders.
      exclude: [
        '/',
        '/about', '/about/**',
        '/facility', '/facility/**',
        '/training', '/training/**',
        '/teams', '/teams/**',
        '/resources', '/resources/**',
        '/api/**',
        '/booking-success', '/booking-success/**',
        '/team-success', '/team-success/**',
        '/confirm', '/confirm/**',
        '/reset-password', '/reset-password/**',
        '/team-waiver', '/team-waiver/**',
        '/privacy', '/privacy/**',
        '/terms', '/terms/**',
        '/sitemap.xml', '/llms.txt', '/robots.txt',
      ],
    }
  }
})
