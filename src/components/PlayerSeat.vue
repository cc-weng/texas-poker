<template>
  <div class="absolute flex flex-col items-center transition-all duration-500"
       :style="positionStyle"
       :class="{ 'z-20': isActive, 'z-10': !isActive, 'opacity-50': player.status === 'out' }">
    
    <!-- Betting Info (Above Player) -->
    <div v-if="player.currentBet > 0" class="mb-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-mono flex items-center gap-1 animate-fade-in-up">
      <div class="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600"></div>
      ${{ player.currentBet }}
    </div>

    <!-- Player Avatar Container -->
    <div class="relative group">
      <!-- Active Player Glow -->
      <div v-if="isActive" class="absolute -inset-2 bg-yellow-400 rounded-full opacity-75 blur animate-pulse"></div>
      
      <!-- Avatar -->
      <div class="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-4 overflow-hidden bg-gray-800 transition-colors duration-300"
           :class="statusBorderClass">
        <img :src="player.avatar" :alt="player.name" class="w-full h-full object-cover" />
        
        <!-- Status Overlay (Folded/All-in) -->
        <div v-if="player.status === 'folded'" class="absolute inset-0 bg-black/70 flex items-center justify-center">
          <span class="text-white font-bold text-xs md:text-sm uppercase">弃牌</span>
        </div>
        <div v-if="player.status === 'allin'" class="absolute inset-0 bg-red-600/50 flex items-center justify-center">
          <span class="text-white font-bold text-xs md:text-sm uppercase animate-pulse">全下</span>
        </div>
        <div v-if="isWinner" class="absolute inset-0 bg-yellow-500/50 flex items-center justify-center">
          <span class="text-white font-bold text-xs md:text-sm uppercase animate-bounce">获胜！</span>
        </div>
      </div>

      <!-- Dealer Button -->
      <div v-if="isDealer" class="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center shadow-md z-20">
        <span class="text-black font-bold text-xs">D</span>
      </div>

      <!-- Hand Cards -->
      <div class="absolute left-1/2 transform -translate-x-1/2 flex -space-x-4 md:-space-x-6 w-max z-30"
           :class="player.isHuman ? 'bottom-2 md:bottom-8' : '-bottom-4'">
        <div v-for="(card, index) in player.hand" :key="index" 
             class="transform transition-transform duration-300 hover:-translate-y-2 origin-bottom"
             :style="{ transform: `rotate(${(index - 0.5) * 10}deg)` }">
          <Card :card="card" :hidden="!shouldShowCards" 
                :class="player.isHuman ? 'w-16 h-24 md:w-28 md:h-40 shadow-2xl' : 'w-10 h-14 md:w-12 md:h-16 shadow-lg'" />
        </div>
      </div>
    </div>

    <!-- Player Info Box -->
    <div class="mt-6 bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-1 text-center min-w-[100px] shadow-lg backdrop-blur-sm">
      <div class="text-white text-xs md:text-sm font-bold truncate max-w-[100px]">{{ player.name }}</div>
      <div class="text-yellow-400 text-xs font-mono flex items-center justify-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.974 6 10 6c.026 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1.002-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.378a9.36 9.36 0 00.46 2H6a1 1 0 100 2h.692c.602 1.372 1.64 2.505 2.971 3.226A1 1 0 0010 18z" clip-rule="evenodd" />
        </svg>
        {{ player.chips }}
      </div>
    </div>
    
    <!-- Hand Strength (Showdown or Self) -->
    <div v-if="shouldShowHandRank && player.handRank" class="mt-1 text-xs text-green-400 font-bold bg-black/60 px-2 rounded-full animate-fade-in">
      {{ player.handRank.name }}
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import Card from './Card.vue';

const props = defineProps({
  player: { type: Object, required: true },
  isActive: Boolean,
  isDealer: Boolean,
  positionStyle: Object,
  showAllCards: Boolean
});

const shouldShowCards = computed(() => {
  return props.player.isHuman || props.showAllCards || props.player.status === 'allin' && props.showAllCards; // Simplified logic, usually show on showdown
});

const shouldShowHandRank = computed(() => {
  return (props.player.isHuman || props.showAllCards) && props.player.handRank;
});

const isWinner = computed(() => {
  // This logic should ideally come from store or props, but for now we can check if chips increased significantly or use a prop
  // Better to pass 'isWinner' prop. For now, let's rely on parent passing a class or status.
  // Actually, let's check if the player is in the winners list in the store. 
  // But here we only have player prop. Let's assume the parent handles the "winner" visual state via a prop or we add a property to player object.
  // The store adds 'winners' array. We can check that in parent.
  return false; // Placeholder, handled by parent logic or store state
});

const statusBorderClass = computed(() => {
  if (props.isActive) return 'border-yellow-400';
  if (props.player.status === 'folded') return 'border-gray-600 grayscale';
  if (props.player.status === 'allin') return 'border-red-500';
  if (props.player.status === 'out') return 'border-red-900';
  return 'border-gray-600';
});
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>