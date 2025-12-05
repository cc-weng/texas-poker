<template>
  <div class="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
    <div class="bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="p-8 text-center relative overflow-hidden">
        <div class="absolute inset-0 opacity-20" :class="isWin ? 'bg-green-600' : 'bg-red-600'"></div>
        <h2 class="text-5xl font-black relative z-10" :class="isWin ? 'text-green-400' : 'text-red-500'">
          {{ isWin ? '胜利！' : '游戏结束' }}
        </h2>
        <p class="text-gray-300 mt-2 relative z-10 text-lg">
          {{ isWin ? '你赢得了所有筹码！' : '你的筹码已用完。' }}
        </p>
      </div>

      <!-- Chart Area -->
      <div class="flex-1 bg-gray-900 p-4 min-h-[300px] relative">
        <div ref="chartRef" class="w-full h-full min-h-[300px]"></div>
      </div>

      <!-- Footer -->
      <div class="p-6 bg-gray-800 border-t border-gray-700 flex justify-center">
        <button @click="$emit('restart')" class="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-12 rounded-full shadow-lg transform active:scale-95 transition-all text-xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          再玩一局
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  type: { type: String, required: true }, // 'WIN' or 'LOSE'
  history: { type: Array, default: () => [] } // [{ round: 1, chips: 10000 }]
});

defineEmits(['restart']);

const chartRef = ref(null);
let chartInstance = null;

const isWin = computed(() => props.type === 'WIN');

onMounted(() => {
  nextTick(() => {
    initChart();
    window.addEventListener('resize', resizeChart);
  });
});

function resizeChart() {
  if (chartInstance) chartInstance.resize();
}

function initChart() {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value);
  
  const rounds = props.history.map(h => `Round ${h.round}`);
  const chips = props.history.map(h => h.chips);
  
  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '筹码历史',
      left: 'center',
      textStyle: { color: '#9ca3af' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: rounds,
      axisLine: { lineStyle: { color: '#4b5563' } },
      axisLabel: { color: '#9ca3af' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#4b5563' } },
      axisLabel: { color: '#9ca3af' },
      splitLine: { lineStyle: { color: '#374151' } }
    },
    series: [
      {
        name: '筹码',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        sampling: 'lttb',
        itemStyle: {
          color: isWin.value ? '#34d399' : '#f87171'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isWin.value ? 'rgba(52, 211, 153, 0.5)' : 'rgba(248, 113, 113, 0.5)' },
            { offset: 1, color: isWin.value ? 'rgba(52, 211, 153, 0)' : 'rgba(248, 113, 113, 0)' }
          ])
        },
        data: chips
      }
    ]
  };
  
  chartInstance.setOption(option);
}
</script>