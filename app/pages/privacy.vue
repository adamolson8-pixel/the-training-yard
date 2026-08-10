<template>
  <div>
    <!-- Hero -->
    <section class="relative py-16 md:py-20 bg-hero-gradient overflow-hidden">
      <div class="absolute inset-0 bg-dark/90"></div>
      <div class="section-container relative">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
          <span>/</span>
          <span class="text-white">Privacy Policy</span>
        </nav>
        <h1 class="heading-xl text-white mb-4">Privacy Policy</h1>
        <p class="text-gray-400">Last updated: July 13, 2026</p>
      </div>
    </section>

    <!-- Content -->
    <section class="section-spacing bg-dark">
      <div class="section-container max-w-3xl mx-auto">
        <div class="prose prose-invert prose-gray max-w-none space-y-8">

          <div>
            <h2 class="heading-sm text-white mb-3">1. Information We Collect</h2>
            <p class="text-gray-400 leading-relaxed">When you book a session, create an account, purchase a membership, or contact us, we may collect personal information including your name, email address, phone number, payment details (processed securely by Stripe), and the names and ages of any dependent athletes on your account.</p>
          </div>

          <div>
            <h2 class="heading-sm text-white mb-3">2. How We Use Your Information</h2>
            <ul class="text-gray-400 space-y-2 list-disc list-inside">
              <li>Process bookings, payments, and memberships</li>
              <li>Send booking confirmations, reminders, and receipts</li>
              <li>Communicate with you about your account or inquiries</li>
              <li>Improve our facility, services, and website experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div>
            <h2 class="heading-sm text-white mb-3">3. Payment Processing</h2>
            <p class="text-gray-400 leading-relaxed">All payments are processed through <strong class="text-white">Stripe</strong>. We never store your full credit card number on our servers. Stripe's privacy practices are governed by their own privacy policy at <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" class="text-amber-400 hover:text-amber-300 underline">stripe.com/privacy</a>.</p>
          </div>

          <div>
            <h2 class="heading-sm text-white mb-3">4. Information Sharing</h2>
            <p class="text-gray-400 leading-relaxed">We do not sell, trade, or rent your personal information to third parties. We may share your information only with:</p>
            <ul class="text-gray-400 space-y-2 list-disc list-inside mt-2">
              <li><strong class="text-white">Stripe</strong> — for payment processing</li>
              <li><strong class="text-white">Supabase</strong> — for secure data storage and authentication</li>
              <li><strong class="text-white">Zoho Mail / Resend</strong> — for transactional email delivery</li>
              <li><strong class="text-white">Law enforcement</strong> — if required by law</li>
            </ul>
          </div>

          <div>
            <h2 class="heading-sm text-white mb-3">5. Cookies & Analytics</h2>
            <p class="text-gray-400 leading-relaxed">Our website uses essential cookies required for authentication and session management. We do not currently use third-party advertising cookies or tracking pixels.</p>
          </div>

          <div>
            <h2 class="heading-sm text-white mb-3">6. Data Security</h2>
            <p class="text-gray-400 leading-relaxed">We implement industry-standard security measures to protect your personal information, including encrypted connections (HTTPS), secure authentication, and restricted access to your data. However, no method of electronic storage is 100% secure.</p>
          </div>

          <div>
            <h2 class="heading-sm text-white mb-3">7. Your Rights</h2>
            <p class="text-gray-400 leading-relaxed">You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:info@trainingyarddsm.com" class="text-amber-400 hover:text-amber-300 underline">info@trainingyarddsm.com</a>. Account holders can update their profile information directly through the customer portal.</p>
          </div>

          <div>
            <h2 class="heading-sm text-white mb-3">8. Children's Privacy</h2>
            <p class="text-gray-400 leading-relaxed">Our services are intended for families with youth athletes. We collect information about minors (name, age) only when provided by a parent or guardian through their account. We do not knowingly collect personal information directly from children under 13.</p>
          </div>

          <div>
            <h2 class="heading-sm text-white mb-3">9. Changes to This Policy</h2>
            <p class="text-gray-400 leading-relaxed">We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Last updated" date. Continued use of our website and services constitutes acceptance of any modifications.</p>
          </div>

          <div>
            <h2 class="heading-sm text-white mb-3">10. Contact Us</h2>
            <p class="text-gray-400 leading-relaxed">For privacy-related questions or requests, contact us at:</p>
            <div class="glass-card p-5 mt-3 space-y-1.5 text-sm text-gray-300">
              <div><strong class="text-white">The Training Yard</strong></div>
              <div>2519 NW 66th Ave, Des Moines, IA 50313</div>
              <div>Phone: <a href="tel:+15154410528" class="text-amber-400 hover:text-amber-300">515.441.0528</a></div>
              <div>Email: <a href="mailto:info@trainingyarddsm.com" class="text-amber-400 hover:text-amber-300">info@trainingyarddsm.com</a></div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Privacy Policy | The Training Yard | Des Moines, IA',
  meta: [
    { name: 'description', content: 'Privacy Policy for The Training Yard in Des Moines, IA. Learn how we collect, use, and protect your personal information.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
</script>
