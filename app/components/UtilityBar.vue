<template>
  <div class="bg-dark-card border-b border-white/5 py-2 relative z-50">
    <div class="section-container">
      <div class="flex items-center justify-between text-sm">
        <!-- Left: Address & Hours -->
        <div class="hidden md:flex items-center gap-6 text-gray-400">
          <a
            id="utility-address"
            href="https://maps.google.com/?q=1234+Sports+Way+Des+Moines+IA+50309"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 hover:text-white transition-colors duration-300"
          >
            <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>1234 Sports Way, Des Moines, IA 50309</span>
          </a>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Mon–Fri 6am–10pm · Sat–Sun 8am–8pm</span>
          </div>
        </div>

        <!-- Right: Phone + CTA -->
        <div class="flex items-center gap-4 ml-auto">
          <a
            id="utility-phone"
            href="tel:+15155550199"
            class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300"
          >
            <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span class="hidden sm:inline">(515) 555-0199</span>
          </a>
          <NuxtLink
            id="utility-book-now"
            to="/training"
            class="btn-primary !px-4 !py-1.5 !text-sm animate-pulse-glow"
          >
            Book Now / Member Login
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
