<template>
  <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="bg-gray-900 p-6 text-center border-b border-gray-700">
        <h2 class="text-3xl font-bold text-yellow-400">本轮结果</h2>
        <div class="mt-2 text-xl font-bold" :class="{'text-green-400': result.netIncome > 0, 'text-red-400': result.netIncome < 0, 'text-gray-400': result.netIncome === 0}">
          {{ result.netIncome > 0 ? '+' : '' }}{{ result.netIncome }} 筹码
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        
        <!-- Community Cards -->
        <div class="flex flex-col items-center">
          <h3 class="text-gray-400 text-sm uppercase tracking-wider mb-2">公共牌</h3>
          <div class="flex gap-2">
            <Card v-for="(card, i) in result.communityCards" :key="i" :card="card" :hidden="false" class="w-12 h-16 md:w-14 md:h-20 shadow-md" />
          </div>
        </div>

        <!-- Winners -->
        <div class="bg-yellow-900/20 rounded-xl p-4 border border-yellow-700/30">
          <h3 class="text-yellow-500 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="text-xl">🏆</span> 获胜者
          </h3>
          <div v-for="(winner, i) in result.winners" :key="i" class="flex items-center justify-between mb-2 last:mb-0 bg-black/20 p-2 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="font-bold text-white">{{ winner.name }}</div>
              <div class="text-xs text-yellow-300 bg-yellow-900/50 px-2 py-0.5 rounded border border-yellow-700/50">{{ winner.handRank }}</div>
            </div>
            <div class="flex gap-1">
               <Card v-for="(card, ci) in winner.cards" :key="ci" :card="card" :hidden="false" class="w-8 h-11 shadow-sm" />
            </div>
            <div class="text-yellow-400 font-mono font-bold">+{{ winner.winAmount }}</div>
          </div>
        </div>

        <!-- My Hand -->
        <div class="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
          <h3 class="text-gray-300 text-sm uppercase tracking-wider mb-3">我的手牌</h3>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="font-bold text-white">你</div>
              <div class="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded border border-gray-600">{{ result.playerHandRank }}</div>
            </div>
            <div class="flex gap-1">
               <Card v-for="(card, ci) in result.playerHand" :key="ci" :card="card" :hidden="false" class="w-10 h-14 shadow-sm" />
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="p-6 bg-gray-900 border-t border-gray-700">
        <button @click="$emit('next')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all text-lg flex items-center justify-center gap-2">
          <span>下一局</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import Card from './Card.vue';

defineProps({
  result: {
    type: Object,
    required: true
  }
});

defineEmits(['next']);
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: #1f2937;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}
</style>