<template>
  <div class="fixed bottom-0 left-0 right-0 bg-gray-900/90 border-t border-gray-700/50 p-2 backdrop-blur-sm z-40 transition-transform duration-300"
       :class="{ 'translate-y-full': !isPlayerTurn }">
    <div class="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
      
      <!-- Raise Slider (Only visible if Raise is selected or always visible but disabled?) -->
      <!-- Let's make it part of the Raise action -->
      <div class="flex-1 w-full md:w-auto flex items-center gap-4 bg-gray-800/50 p-2 rounded-lg" v-if="canRaise">
        <span class="text-white text-sm font-bold whitespace-nowrap">加注: ${{ raiseAmount }}</span>
        <el-slider v-model="raiseAmount" :min="minRaiseAmount" :max="maxRaiseAmount" :step="bigBlind" class="flex-1" />
        <button @click="setRaiseAmount(maxRaiseAmount)" class="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-500">最大</button>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 w-full md:w-auto justify-center">
        <button @click="$emit('action', 'FOLD')" 
                class="px-4 py-2 md:px-6 md:py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg transform active:scale-95 transition-all flex flex-col items-center min-w-[80px] md:min-w-[100px]">
          <span>FOLD</span>
        </button>

        <button @click="$emit('action', canCheck ? 'CHECK' : 'CALL')" 
                class="px-4 py-2 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transform active:scale-95 transition-all flex flex-col items-center min-w-[80px] md:min-w-[100px]">
          <span>{{ canCheck ? 'CHECK' : 'CALL' }}</span>
          <span v-if="!canCheck" class="text-xs opacity-80">${{ callAmount }}</span>
        </button>

        <button v-if="canRaise" @click="$emit('action', 'RAISE', raiseAmount)" 
                class="px-4 py-2 md:px-6 md:py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg transform active:scale-95 transition-all flex flex-col items-center min-w-[80px] md:min-w-[100px]">
          <span>RAISE</span>
          <span class="text-xs opacity-80">${{ raiseAmount }}</span>
        </button>
        
        <button v-else @click="$emit('action', 'ALL_IN')" 
                class="px-4 py-2 md:px-6 md:py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg shadow-lg transform active:scale-95 transition-all flex flex-col items-center min-w-[80px] md:min-w-[100px]">
          <span>ALL IN</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  isPlayerTurn: Boolean,
  canCheck: Boolean,
  callAmount: Number,
  minRaise: Number,
  playerChips: Number,
  currentBet: Number,
  bigBlind: Number
});

const emit = defineEmits(['action']);

const raiseAmount = ref(0);

const minRaiseAmount = computed(() => {
  // Min raise is usually currentBet + minRaise (which is usually bigBlind or last raise amount)
  // But here 'minRaise' prop from store is the increment amount.
  // So total bet would be currentBet + minRaise.
  // However, if currentBet is 0, min raise is bigBlind.
  // Let's simplify: The slider value represents the TOTAL bet amount the player is putting in.
  return props.currentBet + props.minRaise;
});

const maxRaiseAmount = computed(() => props.playerChips + (props.currentBet - props.callAmount)); // Total chips available? 
// Wait, playerChips in store is current stack. 
// If I raise, I put in more chips. Max I can put in is my stack.
// But 'raiseAmount' usually means "raise TO X".
// So max is player.chips + player.currentBet.
// Let's assume playerChips is what they have LEFT.
// So max raise to is playerChips + player.currentBet.

const canRaise = computed(() => {
  return props.playerChips > props.callAmount;
});

// Initialize raise amount
watch(() => props.isPlayerTurn, (newVal) => {
  if (newVal) {
    raiseAmount.value = minRaiseAmount.value;
  }
});

function setRaiseAmount(val) {
  raiseAmount.value = val;
}
</script>

<style scoped>
/* Custom slider styles if needed, but Element Plus slider is good */
</style>