<template>
  <div class="flex justify-center items-center space-x-2 md:space-x-4 h-24 md:h-32">
    <transition-group name="card-deal" tag="div" class="flex space-x-2 md:space-x-4">
      <div v-for="(card, index) in cards" :key="card.toString()" class="relative">
        <Card :card="card" :hidden="false" class="w-14 h-20 md:w-20 md:h-28 shadow-xl" />
      </div>
      <!-- Placeholders for empty slots to keep layout stable -->
      <div v-for="i in (5 - cards.length)" :key="`placeholder-${i}`" 
           class="w-14 h-20 md:w-20 md:h-28 border-2 border-white/20 rounded-lg bg-black/10 backdrop-blur-sm">
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import Card from './Card.vue';

defineProps({
  cards: { type: Array, default: () => [] }
});
</script>

<style scoped>
.card-deal-enter-active {
  transition: all 0.5s ease-out;
}
.card-deal-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.8);
}
.card-deal-leave-active {
  transition: all 0.3s ease-in;
}
.card-deal-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
