<template>
  <section id="facility-diagram" class="section-spacing bg-dark relative overflow-hidden">
    <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

    <div class="section-container">
      <div class="text-center mb-12">
        <span class="badge-turf mb-4 inline-block">Interactive Layout</span>
        <h2 class="heading-lg text-white mb-4">See How the Space Transforms</h2>
        <p class="text-gray-400 max-w-2xl mx-auto">
          Toggle between configurations to see how our 4 retractable batting cages open into a full 60' × 100' multi-sport turf.
        </p>
      </div>

      <!-- Toggle Buttons -->
      <div class="flex justify-center gap-2 mb-10">
        <button
          v-for="mode in modes"
          :key="mode.id"
          :id="`diagram-mode-${mode.id}`"
          class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
          :class="activeMode === mode.id
            ? 'bg-red-gradient text-white shadow-glow-red'
            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'"
          @click="activeMode = mode.id"
        >
          {{ mode.label }}
        </button>
      </div>

      <!-- Diagram -->
      <div class="max-w-4xl mx-auto">
        <div class="glass-card p-8 md:p-12">
          <!-- Field Container -->
          <div class="relative bg-turf/10 rounded-xl border-2 border-turf/30 aspect-[100/60] overflow-hidden flex">
            <!-- Center Line -->
            <div class="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 z-0"></div>
            <!-- Center Circle -->
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white/10 z-0"></div>

            <!-- Left Side: Always Open Turf (52%) -->
            <div class="w-[52%] h-full flex flex-col items-center justify-center z-10">
              <Transition name="fade">
                <div v-if="activeMode === 'open-turf' || activeMode === 'cages'" class="text-center">
                  <div class="text-4xl mb-2">⚽</div>
                  <div class="text-white font-display font-bold text-lg">Open Turf</div>
                  <div class="text-turf text-sm mt-1">52' × 60'</div>
                </div>
              </Transition>
            </div>

            <!-- Right Side: Cage Area (48%) -->
            <div class="w-[48%] h-full relative z-10">
              <!-- Open Turf Mode Text (When all cages retracted) -->
              <Transition name="fade">
                <div v-if="activeMode === 'open-turf'" class="absolute inset-0 flex flex-col items-center justify-center">
                  <div class="text-white font-display font-bold text-lg">Open Turf</div>
                  <div class="text-turf text-sm mt-1">Cages Retracted</div>
                </div>
              </Transition>

              <!-- Team Practice Mode Text (When cages 3/4 retracted) -->
              <Transition name="fade">
                <div v-if="activeMode === 'team'" class="absolute left-0 w-1/2 h-[91.66%] flex flex-col items-center justify-center bg-turf/20 border border-white/5 border-dashed">
                  <div class="text-center p-2">
                    <div class="text-xl mb-1">🏃</div>
                    <div class="text-white text-xs font-semibold">Agility / Fielding</div>
                  </div>
                </div>
              </Transition>

              <!-- Cages Container (55' tall = 91.66% height) -->
              <div class="absolute top-0 right-0 w-full h-[91.66%] flex">
                <TransitionGroup name="cage">
                  <!-- Cage 4 (Left-most) -->
                  <div v-if="activeMode === 'cages' || activeMode === 'two-cage'" key="cage4" class="w-1/4 h-full border-r-2 border-l-2 border-b-2 border-cage/30 bg-cage/10 flex items-center justify-center">
                    <div class="text-center -rotate-90 origin-center">
                      <div class="text-xl mb-1">⚾</div>
                      <div class="text-xs font-semibold text-white/80 whitespace-nowrap">Cage 4</div>
                      <div class="text-[8px] text-cage mt-1 whitespace-nowrap">55' × 12'</div>
                    </div>
                  </div>
                  <!-- Cage 3 -->
                  <div v-if="activeMode === 'cages' || activeMode === 'two-cage'" key="cage3" class="w-1/4 h-full border-r-2 border-b-2 border-cage/30 bg-cage/10 flex items-center justify-center">
                    <div class="text-center -rotate-90 origin-center">
                      <div class="text-xl mb-1">⚾</div>
                      <div class="text-xs font-semibold text-white/80 whitespace-nowrap">Cage 3</div>
                      <div class="text-[8px] text-cage mt-1 whitespace-nowrap">55' × 12'</div>
                    </div>
                  </div>
                  <!-- Cage 2 -->
                  <div v-if="activeMode !== 'open-turf'" key="cage2" class="w-1/4 h-full border-r-2 border-l-2 border-b-2 border-cage/30 bg-cage/10 flex items-center justify-center" :class="{'border-l-2': activeMode === 'team'}">
                    <div class="text-center -rotate-90 origin-center">
                      <div class="text-xl mb-1">⚾</div>
                      <div class="text-xs font-semibold text-white/80 whitespace-nowrap">Cage 2</div>
                      <div class="text-[8px] text-cage mt-1 whitespace-nowrap">55' × 12'</div>
                    </div>
                  </div>
                  <!-- Cage 1 (Right-most) -->
                  <div v-if="activeMode !== 'open-turf'" key="cage1" class="w-1/4 h-full border-r-2 border-b-2 border-cage/30 bg-cage/10 flex items-center justify-center">
                    <div class="text-center -rotate-90 origin-center">
                      <div class="text-xl mb-1">⚾</div>
                      <div class="text-xs font-semibold text-white/80 whitespace-nowrap">Cage 1</div>
                      <div class="text-[8px] text-cage mt-1 whitespace-nowrap">55' × 12'</div>
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </div>

            <!-- Dimension Labels -->
            <div class="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white/40 font-mono">100' Width</div>
            <div class="absolute top-1/2 -translate-y-1/2 left-1 text-[10px] text-white/40 font-mono writing-vertical" style="writing-mode: vertical-rl; transform: rotate(180deg) translateY(50%);">60' Depth</div>
          </div>

          <!-- Legend -->
          <div class="flex flex-wrap justify-center gap-6 mt-6 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-cage/30 border border-cage/50"></div>
              <span class="text-gray-400">Batting Cage (55' × 12')</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-turf/20 border border-turf/40"></div>
              <span class="text-gray-400">Open Turf</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-white/10 border border-white/20"></div>
              <span class="text-gray-400">Retractable Netting</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const activeMode = ref('cages')

const modes = [
  { id: 'cages', label: 'All 4 Cages Active' },
  { id: 'two-cage', label: 'Cages + Large Turf' },
  { id: 'team', label: 'Team Setup (2 Cages)' },
  { id: 'open-turf', label: 'Full Open Turf' },
]
</script>

<style scoped>
.cage-enter-active,
.cage-leave-active {
  transition: all 0.5s ease;
}
.cage-enter-from,
.cage-leave-to {
  opacity: 0;
  transform: scaleX(0.8);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
