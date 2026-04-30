<template>
  <section id="home-faq" class="section-spacing bg-dark">
    <div class="section-container">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-12">
          <span class="badge-primary mb-4 inline-block">FAQ</span>
          <h2 class="heading-md text-white mb-3">Frequently Asked Questions</h2>
          <p class="text-gray-400">Everything parents and coaches need to know before visiting.</p>
        </div>

        <div class="space-y-4">
          <div
            v-for="(item, index) in faqs"
            :key="index"
            class="glass-card overflow-hidden transition-all duration-300"
          >
            <button
              :id="`faq-toggle-${index}`"
              class="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors duration-300"
              @click="toggleFaq(index)"
              :aria-expanded="openFaq === index"
            >
              <h3 class="font-display font-semibold text-white pr-4">{{ item.question }}</h3>
              <svg
                class="w-5 h-5 text-primary shrink-0 transition-transform duration-300"
                :class="{ 'rotate-180': openFaq === index }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-96 opacity-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="max-h-96 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div v-if="openFaq === index" class="overflow-hidden">
                <div class="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                  {{ item.answer }}
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const openFaq = ref<number | null>(null)

const toggleFaq = (index: number) => {
  openFaq.value = openFaq.value === index ? null : index
}

const faqs = [
  {
    question: 'What sports can you train at The Training Yard?',
    answer: 'The Training Yard supports baseball, softball, soccer, agility and speed training, flag football, and general athletic conditioning. Our 60\' × 100\' turf and 4 retractable batting cages accommodate virtually any indoor sport or drill.',
  },
  {
    question: 'How big is the facility?',
    answer: 'The Training Yard is 6,000 square feet (60 feet wide × 100 feet long) of premium synthetic turf. The ceiling height accommodates fly balls, pop-ups, and overhead throws. When all four batting cages are retracted, you have the full 60\' × 100\' field available.',
  },
  {
    question: 'Can a team rent the whole turf?',
    answer: 'Absolutely. We offer full-turf team rentals by the hour, and seasonal team contracts for clubs that need guaranteed weekly practice time. When you book the full turf, all four batting cages retract to give your team the complete 60\' × 100\' space.',
  },
  {
    question: 'Do members get discounts or priority booking?',
    answer: 'Yes. All membership tiers include priority online booking, discounted hourly rates, and access to member-only open gym sessions. Family Pass and Seasonal Team members receive additional perks including discounts on clinics, camps, and equipment rentals.',
  },
  {
    question: 'What ages is the facility best for?',
    answer: 'The Training Yard serves athletes from age 6 through adult, with the sweet spot being youth athletes ages 8–18. Our cages, turf, and programs are designed for developing athletes, club/travel teams, and high school players looking to train year-round.',
  },
  {
    question: 'What should players bring?',
    answer: 'For batting cages: your own bat, batting gloves, and helmet (we have loaners available). For turf: indoor-appropriate athletic shoes (no metal cleats). For soccer: indoor soccer shoes or turf shoes. We provide balls, tees, and nets.',
  },
]
</script>
