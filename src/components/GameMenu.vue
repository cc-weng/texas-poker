<template>
  <div class="relative">
    <!-- 菜单按钮 -->
    <button 
      @click="toggleMenu"
      class="bg-black/50 backdrop-blur-md p-3 rounded-lg border border-yellow-600/50 hover:border-yellow-500 hover:bg-black/70 transition-all duration-200 group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400 group-hover:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- 下拉菜单 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-2"
    >
      <div 
        v-if="isOpen" 
        class="absolute top-full right-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-md rounded-xl border border-gray-600 shadow-2xl overflow-hidden z-50"
      >
        <div class="py-2">
          <!-- 重新开始 -->
          <button 
            @click="handleRestart"
            class="w-full px-4 py-3 text-left text-white hover:bg-yellow-500/20 transition-colors flex items-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>重新开始</span>
          </button>

          <!-- 分割线 -->
          <div class="border-t border-gray-600 my-1"></div>

          <!-- 立即结算 -->
          <button 
            @click="handleSettle"
            class="w-full px-4 py-3 text-left text-white hover:bg-green-500/20 transition-colors flex items-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>立即结算</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 确认弹窗 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showConfirm" class="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center" @click.self="cancelAction">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-90"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-90"
        >
          <div v-if="showConfirm" class="bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 border border-gray-600 shadow-2xl">
            <h3 class="text-xl font-bold text-white mb-2">{{ confirmTitle }}</h3>
            <p class="text-gray-400 mb-6">{{ confirmMessage }}</p>
            <div class="flex gap-3">
              <button 
                @click="cancelAction"
                class="flex-1 py-2.5 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
              >
                取消
              </button>
              <button 
                @click="confirmAction"
                class="flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors"
                :class="confirmActionType === 'restart' ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-green-500 hover:bg-green-400 text-black'"
              >
                确定
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- 点击外部关闭菜单 -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="closeMenu"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['restart', 'settle']);

const isOpen = ref(false);
const showConfirm = ref(false);
const confirmActionType = ref(''); // 'restart' or 'settle'

const confirmTitle = computed(() => {
  return confirmActionType.value === 'restart' ? '重新开始' : '立即结算';
});

const confirmMessage = computed(() => {
  return confirmActionType.value === 'restart' 
    ? '确定要重新开始游戏吗？当前进度将会丢失。'
    : '确定要立即结算吗？将根据当前筹码数量判定胜负。';
});

function toggleMenu() {
  isOpen.value = !isOpen.value;
}

function closeMenu() {
  isOpen.value = false;
}

function handleRestart() {
  confirmActionType.value = 'restart';
  showConfirm.value = true;
  closeMenu();
}

function handleSettle() {
  confirmActionType.value = 'settle';
  showConfirm.value = true;
  closeMenu();
}

function cancelAction() {
  showConfirm.value = false;
  confirmActionType.value = '';
}

function confirmAction() {
  if (confirmActionType.value === 'restart') {
    emit('restart');
  } else if (confirmActionType.value === 'settle') {
    emit('settle');
  }
  showConfirm.value = false;
  confirmActionType.value = '';
}
</script>
