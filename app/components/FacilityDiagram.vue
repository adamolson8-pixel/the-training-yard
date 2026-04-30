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
          <div class="relative bg-turf/10 rounded-xl border-2 border-turf/30 aspect-[100/60] overflow-hidden">
            <!-- Field lines -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-px h-full bg-white/10"></div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-20 h-20 rounded-full border border-white/10"></div>
            </div>

            <!-- Cage Dividers - Animated -->
            <Transition name="cage">
              <div v-if="activeMode === 'cages' || activeMode === 'two-cage'" class="absolute inset-0 flex">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="flex-1 border-r-2 last:border-r-0 transition-all duration-700 flex items-center justify-center"
                  :class="getCageClass(i)"
                  :style="getCageStyle(i)"
                >
                  <div class="text-center" v-if="isCageActive(i)">
                    <div class="text-2xl mb-1">{{ activeMode === 'cages' ? '⚾' : '⚾' }}</div>
                    <div class="text-xs font-semibold text-white/80">Cage {{ i }}</div>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Open Turf Mode -->
            <Transition name="fade">
              <div v-if="activeMode === 'open-turf'" class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-4xl mb-2">⚽</div>
                  <div class="text-white font-display font-bold text-lg">Full 60' × 100' Open Turf</div>
                  <div class="text-turf text-sm mt-1">All cages retracted</div>
                </div>
              </div>
            </Transition>

            <!-- Team Practice Mode -->
            <Transition name="fade">
              <div v-if="activeMode === 'team'" class="absolute inset-0 flex">
                <div class="flex-1 border-r-2 border-white/10 flex items-center justify-center bg-cage/5">
                  <div class="text-center">
                    <div class="text-2xl mb-1">⚾</div>
                    <div class="text-xs font-semibold text-white/80">Cage 1<br /><span class="text-cage text-[10px]">Hitting Station</span></div>
                  </div>
                </div>
                <div class="flex-1 border-r-2 border-white/10 flex items-center justify-center bg-cage/5">
                  <div class="text-center">
                    <div class="text-2xl mb-1">⚾</div>
                    <div class="text-xs font-semibold text-white/80">Cage 2<br /><span class="text-cage text-[10px]">Hitting Station</span></div>
                  </div>
                </div>
                <div class="flex-[2] flex items-center justify-center bg-turf/10">
                  <div class="text-center">
                    <div class="text-3xl mb-1">🏃</div>
                    <div class="text-white font-display font-semibold">Open Practice Area</div>
                    <div class="text-turf text-xs mt-1">Fielding · Agility · Warm-ups</div>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Dimension Labels -->
            <div class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/40 font-mono">100'</div>
            <div class="absolute top-1/2 -translate-y-1/2 left-2 text-[10px] text-white/40 font-mono writing-vertical" style="writing-mode: vertical-rl; transform: rotate(180deg) translateY(50%);">60'</div>
          </div>

          <!-- Legend -->
          <div class="flex flex-wrap justify-center gap-6 mt-6 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-cage/30 border border-cage/50"></div>
              <span class="text-gray-400">Batting Cage</span>
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
  { id: 'cages', label: '4 Cages Active' },
  { id: 'two-cage', label: '2 Cages + Turf' },
  { id: 'team', label: 'Team Practice' },
  { id: 'open-turf', label: 'Full Open Turf' },
]

const getCageClass = (index: number) => {
  if (activeMode.value === 'cages') return 'bg-cage/10 border-cage/30'
  if (activeMode.value === 'two-cage') {
    return index <= 2 ? 'bg-cage/10 border-cage/30' : 'bg-turf/10 border-turf/20'
  }
  return 'bg-white/5 border-white/10'
}

const getCageStyle = (index: number) => {
  if (activeMode.value === 'two-cage' && index > 2) {
    return { flex: index === 3 ? '1' : '1' }
  }
  return {}
}

const isCageActive = (index: number) => {
  if (activeMode.value === 'cages') return true
  if (activeMode.value === 'two-cage') return index <= 2
  return false
}
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
