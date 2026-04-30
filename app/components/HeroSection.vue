<template>
  <section id="hero" class="relative min-h-[90vh] flex items-center overflow-hidden">
    <!-- Background Image with Overlay -->
    <div class="absolute inset-0">
      <img
        src="/images/hero-facility.png"
        alt="The Training Yard indoor sports facility"
        class="w-full h-full object-cover"
      />
      <!-- Directional gradient: dark behind text (bottom-left), transparent over facility (top-right) -->
      <div class="absolute inset-0" style="background: linear-gradient(135deg, rgba(15,15,26,0.85) 0%, rgba(15,15,26,0.55) 40%, rgba(15,15,26,0.25) 100%);"></div>
      <!-- Subtle bottom scrim for text legibility -->
      <div class="absolute inset-0 bg-gradient-to-t from-dark/70 via-transparent to-transparent"></div>
    </div>

    <!-- Animated Grid Pattern -->
    <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;1&quot;%3E%3Cpath d=&quot;M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>

    <!-- Content -->
    <div class="relative section-container py-20 md:py-28">
      <div class="max-w-3xl">
        <!-- Logo Stamp — large, dominant brand anchor -->
        <div class="mb-8 animate-fade-in">
          <img
            src="/images/logo.jpg"
            alt="The Training Yard"
            class="h-28 md:h-40 w-auto rounded-2xl shadow-glow-red-lg border-2 border-primary/30"
          />
        </div>

        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
          <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span class="text-sm font-medium text-primary-light">Des Moines' Premier Indoor Training Facility</span>
        </div>

        <!-- Heading — tight two-liner with brand-red accent -->
        <h1 class="heading-xl text-white mb-6 animate-fade-in-up !leading-[1.1]" style="animation-delay: 0.1s; opacity: 0; text-shadow: 0 2px 20px rgba(0,0,0,0.5);">
          Indoor Turf &amp; Batting Cages<br class="hidden sm:block" />
          for <span class="text-primary">Youth Athletes</span>
        </h1>

        <!-- Subheading — carries the full messaging now -->
        <p class="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl animate-fade-in-up leading-relaxed" style="animation-delay: 0.2s; opacity: 0; text-shadow: 0 1px 10px rgba(0,0,0,0.4);">
          Baseball. Softball. Soccer. Agility. 6,000 sq ft of premium synthetic turf and 4 batting cages —
          open year-round for individual training, team practices, and competitive development.
        </p>

        <!-- Micro-proof stats -->
        <div class="flex flex-wrap gap-6 mb-10 animate-fade-in-up" style="animation-delay: 0.3s; opacity: 0;">
          <div class="flex items-center gap-2 text-gray-400">
            <svg class="w-5 h-5 text-turf" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-medium">60' × 100' Indoor Turf</span>
          </div>
          <div class="flex items-center gap-2 text-gray-400">
            <svg class="w-5 h-5 text-cage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-medium">4 Batting Cages</span>
          </div>
          <div class="flex items-center gap-2 text-gray-400">
            <svg class="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-medium">Year-Round Access</span>
          </div>
        </div>

        <!-- Dual CTA: User Segmentation -->
        <div class="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style="animation-delay: 0.4s; opacity: 0;">
          <NuxtLink
            id="hero-cta-individual"
            to="/training"
            class="btn-primary-lg group"
          >
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Individual Training
            <svg class="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
          <NuxtLink
            id="hero-cta-team"
            to="/training"
            class="btn-secondary group text-lg px-8 py-4"
          >
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Team &amp; Club Rentals
            <svg class="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
      <div class="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
        <div class="w-1.5 h-3 rounded-full bg-primary animate-pulse"></div>
      </div>
    </div>
  </section>
</template>
