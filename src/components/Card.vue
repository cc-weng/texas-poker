<template>
  <div class="perspective-1000 w-16 h-24 relative cursor-pointer transition-transform duration-300 hover:-translate-y-2"
       :class="{ 'flipped': hidden }">
    <div class="card-inner w-full h-full relative preserve-3d transition-transform duration-500"
         :class="{ 'rotate-y-180': hidden }">
      <!-- Front -->
      <div class="card-front absolute w-full h-full backface-hidden rounded-lg shadow-md overflow-hidden bg-white border border-gray-200">
        <img :src="card?.getImageUrl()" :alt="card?.toString()" class="w-full h-full object-contain" v-if="card" />
      </div>
      <!-- Back -->
      <div class="card-back absolute w-full h-full backface-hidden rotate-y-180 rounded-lg shadow-md overflow-hidden bg-blue-800 border-2 border-white">
        <div class="w-full h-full bg-pattern opacity-80"></div>
        <div class="absolute inset-0 flex items-center justify-center">
           <div class="w-8 h-12 border-2 border-white rounded opacity-50"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  card: Object,
  hidden: Boolean
});
</script>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}
.preserve-3d {
  transform-style: preserve-3d;
}
.backface-hidden {
  backface-visibility: hidden;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
.bg-pattern {
  background-image: radial-gradient(#ffffff 15%, transparent 16%),
  radial-gradient(#ffffff 15%, transparent 16%);
  background-size: 10px 10px;
  background-position: 0 0, 5px 5px;
}
</style>