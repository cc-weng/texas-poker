<template>
  <div class="min-h-screen bg-gray-900 overflow-hidden relative select-none font-sans">
    <Analytics />
    <!-- Background Texture -->
    <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] bg-green-800 opacity-80 pointer-events-none"></div>
    <div class="absolute inset-0 bg-radial-gradient pointer-events-none"></div>

    <!-- Header / Stats -->
    <div class="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-40 pointer-events-none">
      <div class="bg-black/40 backdrop-blur-md rounded-lg p-2 text-white pointer-events-auto">
        <h1 class="text-xl font-bold text-yellow-400">德州扑克</h1>
        <div class="text-xs text-gray-300">盲注: ${{ game.smallBlind }} / ${{ game.bigBlind }}</div>
      </div>
      
      <!-- 右侧：菜单 + 日志 -->
      <div class="flex items-start gap-2 pointer-events-auto">
        <!-- 游戏菜单 -->
        <GameMenu 
          v-if="game.players.length > 0"
          @restart="handleRestart" 
          @settle="handleSettle" 
        />
        <!-- Game Log (Collapsible or fixed small box) -->
        <div class="bg-black/40 backdrop-blur-md rounded-lg p-2 w-48 md:w-64 max-h-40 overflow-y-auto text-xs text-gray-200 scrollbar-hide hidden md:block">
          <div v-for="(log, i) in game.logs" :key="i" class="mb-1">
            <span class="text-gray-400">[{{ log.time }}]</span> {{ log.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Game Area -->
    <div class="relative w-full h-screen flex items-center justify-center overflow-hidden">
      
      <!-- Poker Table -->
      <div class="relative w-[95vw] h-[60vh] md:w-[80vw] md:h-[70vh] bg-green-700 rounded-[200px] border-[16px] border-amber-900 shadow-2xl flex items-center justify-center">
        <!-- Table Felt Texture -->
        <div class="absolute inset-0 rounded-[180px] border border-white/10 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-50"></div>
        
        <!-- Center Area: Pot & Community Cards -->
        <div class="flex flex-col items-center justify-center z-10 space-y-4 md:space-y-8">
          <!-- Pot Display -->
          <div class="bg-black/60 text-yellow-400 px-6 py-2 rounded-full text-xl md:text-2xl font-bold border border-yellow-600 shadow-lg animate-pulse flex items-center gap-2">
            <span>底池: ${{ game.pot }}</span>
          </div>

          <!-- Community Cards -->
          <CommunityCards :cards="game.communityCards" />
          
          <!-- Game Message / Winner -->
          <div v-if="game.winners.length > 0" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-24 z-50">
             <div class="bg-yellow-500 text-black font-bold px-6 py-3 rounded-lg shadow-xl text-xl animate-bounce text-center whitespace-nowrap">
               {{ game.winners.map(w => w.name).join(' & ') }} 获胜！
             </div>
          </div>
        </div>

        <!-- Players -->
        <PlayerSeat 
          v-for="(player, index) in game.players" 
          :key="player.id"
          :player="player"
          :isActive="game.currentPlayerIndex === index"
          :isDealer="game.dealerIndex === index"
          :positionStyle="getPlayerPosition(index, game.players.length)"
          :showAllCards="game.gameStage === 'SHOWDOWN' || player.isHuman"
        />
      </div>
    </div>

    <!-- Controls -->
    <Controls 
      v-if="game.humanPlayer && game.humanPlayer.status !== 'out'"
      :isPlayerTurn="isHumanTurn"
      :canCheck="game.canCheck"
      :callAmount="game.currentBet - (game.humanPlayer?.currentBet || 0)"
      :minRaise="game.minRaise"
      :playerChips="game.humanPlayer?.chips || 0"
      :currentBet="game.currentBet"
      :bigBlind="game.bigBlind"
      @action="handleAction"
    />

    <!-- Round Result Overlay -->
    <RoundResult 
      v-if="game.showRoundResult && game.roundResult" 
      :result="game.roundResult" 
      @next="game.nextHand" 
    />

    <!-- Game Over Overlay -->
    <GameOver 
      v-if="game.gameOverType" 
      :type="game.gameOverType" 
      :history="game.chipHistory" 
      @restart="startGame(6)" 
    />

    <!-- Loading Overlay -->
    <div v-if="!game.isResourceLoaded" class="fixed inset-0 bg-gray-900 z-[100] flex flex-col items-center justify-center">
      <div class="text-yellow-400 text-4xl font-bold mb-4 animate-pulse">德州扑克</div>
      <div class="w-64 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
        <div class="h-full bg-yellow-500 transition-all duration-300 ease-out" :style="{ width: `${game.loadingProgress}%` }"></div>
      </div>
      <div class="text-gray-400 mt-2 text-sm">加载资源中... {{ game.loadingProgress }}%</div>
    </div>

    <!-- Start Game Overlay -->
    <div v-if="game.isResourceLoaded && game.players.length === 0" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border border-gray-700">
        <h2 class="text-3xl font-bold text-white mb-6">德州扑克</h2>
        <p class="text-gray-400 mb-8">体验经典纸牌游戏，与AI对手一较高下</p>
        <div class="space-y-4">
          <el-button type="primary" size="large" class="w-full !text-lg !py-6" @click="startGame(6)">
            开始 6 人游戏
          </el-button>
          <el-button type="success" size="large" class="w-full !text-lg !py-6" @click="startGame(9)">
            开始 9 人游戏
          </el-button>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useGameStore } from './stores/game';
import PlayerSeat from './components/PlayerSeat.vue';
import CommunityCards from './components/CommunityCards.vue';
import Controls from './components/Controls.vue';
import RoundResult from './components/RoundResult.vue';
import GameOver from './components/GameOver.vue';
import GameMenu from './components/GameMenu.vue';
import { Analytics } from "@vercel/analytics/next"

const game = useGameStore();

onMounted(() => {
  game.preloadAssets();
});

const isHumanTurn = computed(() => {
  return game.currentPlayerIndex !== -1 && 
         game.players[game.currentPlayerIndex]?.isHuman && 
         game.gameStage !== 'SHOWDOWN';
});

function startGame(count) {
  game.initGame(count);
  game.startNewHand();
}

function handleAction(action, amount) {
  game.playerAction(action, amount);
}

// 重新开始游戏
function handleRestart() {
  game.restartGame(game.players.length || 6);
}

// 立即结算
function handleSettle() {
  game.settleNow();
}

// Calculate positions for an ellipse
function getPlayerPosition(index, totalPlayers) {
  // We want the human player (index 0) to be at the bottom center
  // The table is an ellipse.
  // Angle 90 degrees (PI/2) is bottom in standard math, but let's adjust.
  // Let's define angles starting from bottom (PI/2) and going clockwise?
  // Or just distribute evenly.
  
  // Shift index so 0 is at bottom.
  // In a circle, 0 is usually right (0 rad). Bottom is PI/2.
  // We want index 0 at PI/2.
  // Angle = (index / total) * 2PI + offset
  
  const angleOffset = Math.PI / 2; // Start at bottom
  const angle = (index / totalPlayers) * 2 * Math.PI + angleOffset;
  
  // Ellipse radii (percentage of container)
  // Container is the table div.
  // We want players ON the edge or slightly outside.
  // Let's use absolute positioning relative to the table center.
  // Table is centered.
  
  // Using percentages relative to the table size
  // Radius X = 50% + offset, Radius Y = 50% + offset
  const rx = 55; // % width
  const ry = 60; // % height
  
  const x = 50 + rx * Math.cos(angle);
  const y = 50 + ry * Math.sin(angle);
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)'
  };
}
</script>

<style>
.bg-radial-gradient {
  background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%);
}
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>