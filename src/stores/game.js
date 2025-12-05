import { defineStore } from 'pinia';
import { createDeck, shuffleDeck, evaluateHand, HAND_RANKS, preloadDeckImages } from '../utils/poker';
import _ from 'lodash';
import { Howl } from 'howler';

// Sound effects (placeholders, will try to find real URLs or use silent fallback)
const sounds = {
  shuffle: new Howl({ src: ['https://actions.google.com/sounds/v1/cartoon/card_shuffle.ogg'] }), // Example URL
  chip: new Howl({ src: ['https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg'] }), // Placeholder for chip sound
  deal: new Howl({ src: ['https://actions.google.com/sounds/v1/cartoon/pop.ogg'] }), // Placeholder
  win: new Howl({ src: ['https://actions.google.com/sounds/v1/cartoon/clown_horn.ogg'] }) // Placeholder
};

export const GAME_STAGES = {
  IDLE: 'IDLE',
  PRE_FLOP: 'PRE_FLOP',
  FLOP: 'FLOP',
  TURN: 'TURN',
  RIVER: 'RIVER',
  SHOWDOWN: 'SHOWDOWN'
};

export const PLAYER_ACTIONS = {
  FOLD: 'FOLD',
  CHECK: 'CHECK',
  CALL: 'CALL',
  RAISE: 'RAISE',
  ALL_IN: 'ALL_IN'
};

export const useGameStore = defineStore('game', {
  state: () => ({
    players: [], // { id, name, chips, hand: [], status: 'active'|'folded'|'allin', currentBet: 0, isHuman: boolean, avatar: string }
    communityCards: [],
    deck: [],
    pot: 0,
    currentBet: 0,
    dealerIndex: 0,
    currentPlayerIndex: -1,
    gameStage: GAME_STAGES.IDLE,
    smallBlind: 10,
    bigBlind: 20,
    winners: [],
    logs: [],
    minRaise: 20,
    isResourceLoaded: false,
    loadingProgress: 0,
    // New states for optimization
    chipHistory: [], // [{ round: 1, chips: 10000 }]
    roundCount: 0,
    roundResult: null, // { winners: [], playerHand: null, playerHandRank: null, netIncome: 0 }
    showRoundResult: false,
    gameOverType: null, // 'WIN' | 'LOSE' | null
    playerStartChips: 0 // To calculate net income for the round
  }),

  getters: {
    activePlayers: (state) => state.players.filter(p => p.status !== 'folded' && p.chips > 0),
    currentPlayer: (state) => state.players[state.currentPlayerIndex],
    humanPlayer: (state) => state.players.find(p => p.isHuman),
    canCheck: (state) => {
      const player = state.players[state.currentPlayerIndex];
      if (!player) return false;
      return state.currentBet === player.currentBet;
    }
  },

  actions: {
    async preloadAssets() {
      if (this.isResourceLoaded) return;
      
      this.addLog('正在加载资源...');
      try {
        await preloadDeckImages((progress) => {
            this.loadingProgress = Math.floor(progress * 100);
        });
        this.isResourceLoaded = true;
        this.addLog('资源加载完成。');
      } catch (e) {
        console.error("Failed to preload assets", e);
        this.isResourceLoaded = true; // Proceed anyway
      }
    },

    initGame(playerCount = 6) {
      this.players = [];
      // Human player
      this.players.push({
        id: 0,
        name: '你',
        chips: 10000,
        hand: [],
        status: 'active',
        currentBet: 0,
        isHuman: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You'
      });

      // AI players
      for (let i = 1; i < playerCount; i++) {
        this.players.push({
          id: i,
          name: `机器人 ${i}`,
          chips: 10000,
          hand: [],
          status: 'active',
          currentBet: 0,
          isHuman: false,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Bot${i}`
        });
      }
      this.dealerIndex = Math.floor(Math.random() * playerCount);
      
      // Reset stats
      this.chipHistory = [{ round: 0, chips: 10000 }];
      this.roundCount = 0;
      this.gameOverType = null;
      this.showRoundResult = false;
      
      this.addLog('游戏已初始化，等待开始...');
    },

    startNewHand() {
      // Check game over conditions before starting
      const human = this.players.find(p => p.isHuman);
      const activeOpponents = this.players.filter(p => !p.isHuman && p.chips > 0);
      
      if (human.chips <= 0) {
        this.gameOverType = 'LOSE';
        return;
      }
      if (activeOpponents.length === 0) {
        this.gameOverType = 'WIN';
        return;
      }

      if (this.players.filter(p => p.chips > 0).length < 2) {
        this.addLog('玩家不足，无法继续游戏。');
        return;
      }

      this.roundCount++;
      this.playerStartChips = human.chips; // Record start chips
      this.showRoundResult = false;
      this.roundResult = null;

      this.gameStage = GAME_STAGES.PRE_FLOP;
      this.deck = shuffleDeck(createDeck());
      this.communityCards = [];
      this.pot = 0;
      this.currentBet = this.bigBlind;
      this.minRaise = this.bigBlind;
      this.winners = [];
      
      // Reset player states
      this.players.forEach(p => {
        p.hand = [];
        p.currentBet = 0;
        p.status = p.chips > 0 ? 'active' : 'out';
        p.handRank = null;
      });

      // Move dealer button
      this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
      while (this.players[this.dealerIndex].chips <= 0) {
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
      }

      // Blinds
      const sbIndex = this.getNextActivePlayerIndex(this.dealerIndex);
      const bbIndex = this.getNextActivePlayerIndex(sbIndex);

      this.placeBet(sbIndex, Math.min(this.smallBlind, this.players[sbIndex].chips));
      this.placeBet(bbIndex, Math.min(this.bigBlind, this.players[bbIndex].chips));

      // Deal hole cards
      sounds.shuffle.play();
      for (let i = 0; i < 2; i++) {
        this.players.forEach(p => {
          if (p.status === 'active') {
            p.hand.push(this.deck.pop());
          }
        });
      }

      this.currentPlayerIndex = this.getNextActivePlayerIndex(bbIndex);
      this.addLog('新一局开始，盲注已下注。');
      
      this.processTurn();
    },

    getNextActivePlayerIndex(startIndex) {
      let index = (startIndex + 1) % this.players.length;
      while (this.players[index].status === 'out' || this.players[index].status === 'folded') {
        index = (index + 1) % this.players.length;
        if (index === startIndex) break; // Should not happen if check active players
      }
      return index;
    },

    placeBet(playerIndex, amount) {
      const player = this.players[playerIndex];
      const actualAmount = Math.min(amount, player.chips);
      player.chips -= actualAmount;
      player.currentBet += actualAmount;
      this.pot += actualAmount;
      
      if (player.currentBet > this.currentBet) {
        this.currentBet = player.currentBet;
        this.minRaise = Math.max(this.minRaise, actualAmount); // Simplified raise rule
      }
      
      if (player.chips === 0) {
        player.status = 'allin';
      }
      sounds.chip.play();
    },

    async processTurn() {
      const player = this.players[this.currentPlayerIndex];
      
      // Check if round is complete
      if (this.isRoundComplete()) {
        await this.nextStage();
        return;
      }

      if (!player.isHuman) {
        setTimeout(() => {
          this.aiMove(player);
        }, 1000);
      }
    },

    isRoundComplete() {
      const activePlayers = this.players.filter(p => p.status === 'active');
      // If only one player left (everyone else folded)
      if (this.players.filter(p => p.status !== 'folded' && p.status !== 'out').length === 1) {
        return true;
      }
      
      // Check if all active players have matched the current bet
      const allMatched = activePlayers.every(p => p.currentBet === this.currentBet);
      
      // Also need to ensure everyone has had a chance to act. 
      // This is a simplified check. A robust state machine would track "last aggressor".
      // For this demo, we'll assume if everyone matched and we are back to the start or everyone checked, it's done.
      // But we need to handle the case where BB checks in pre-flop.
      
      // Simplified: If all active players have bet equal to currentBet, AND we've gone around.
      // We can track "players acted this round".
      // Let's use a simpler heuristic: if current player has already bet == currentBet, and next player also has, it might be done.
      // Better: track `lastRaiserIndex`. If we reach `lastRaiserIndex` and they check/call, round ends.
      
      // For this MVP, we will rely on the `nextTurn` logic to detect end of round.
      // If `currentPlayer` has already matched the bet and we are cycling back...
      
      // Let's add a `actionsTakenThisRound` counter or similar.
      // Actually, the standard way is: Round ends when all players have acted at least once, and all active players have equal bets (or are all-in).
      
      return activePlayers.every(p => p.currentBet === this.currentBet || p.status === 'allin') && this.hasEveryoneActed();
    },
    
    // Helper to track if everyone acted. We reset a flag `acted` on stage change.
    hasEveryoneActed() {
      // We can add an `acted` property to players and reset it on new stage.
      return this.players.filter(p => p.status === 'active').every(p => p.acted);
    },

    async nextTurn() {
      // Mark current player as acted
      if (this.players[this.currentPlayerIndex].status === 'active') {
        this.players[this.currentPlayerIndex].acted = true;
      }

      if (this.isRoundComplete()) {
        await this.nextStage();
      } else {
        this.currentPlayerIndex = this.getNextActivePlayerIndex(this.currentPlayerIndex);
        this.processTurn();
      }
    },

    async nextStage() {
      // Reset player bets and acted status for next round
      this.players.forEach(p => {
        p.currentBet = 0;
        p.acted = false;
      });
      this.currentBet = 0;
      this.minRaise = this.bigBlind;

      // Check if only one player left
      const remainingPlayers = this.players.filter(p => p.status !== 'folded' && p.status !== 'out');
      if (remainingPlayers.length === 1) {
        this.resolveWinner(remainingPlayers);
        return;
      }

      switch (this.gameStage) {
        case GAME_STAGES.PRE_FLOP:
          this.gameStage = GAME_STAGES.FLOP;
          this.deck.pop(); // Burn card
          this.communityCards.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
          sounds.deal.play();
          break;
        case GAME_STAGES.FLOP:
          this.gameStage = GAME_STAGES.TURN;
          this.deck.pop(); // Burn
          this.communityCards.push(this.deck.pop());
          sounds.deal.play();
          break;
        case GAME_STAGES.TURN:
          this.gameStage = GAME_STAGES.RIVER;
          this.deck.pop(); // Burn
          this.communityCards.push(this.deck.pop());
          sounds.deal.play();
          break;
        case GAME_STAGES.RIVER:
          this.gameStage = GAME_STAGES.SHOWDOWN;
          this.resolveShowdown();
          return;
      }

      // Set current player to first active player after dealer
      this.currentPlayerIndex = this.getNextActivePlayerIndex(this.dealerIndex);
      this.processTurn();
    },

    playerAction(action, amount = 0) {
      const player = this.players[this.currentPlayerIndex];
      
      switch (action) {
        case PLAYER_ACTIONS.FOLD:
          player.status = 'folded';
          this.addLog(`${player.name} 弃牌`);
          break;
        case PLAYER_ACTIONS.CHECK:
          this.addLog(`${player.name} 过牌`);
          break;
        case PLAYER_ACTIONS.CALL:
          const callAmount = this.currentBet - player.currentBet;
          this.placeBet(this.currentPlayerIndex, callAmount);
          this.addLog(`${player.name} 跟注 ${callAmount}`);
          break;
        case PLAYER_ACTIONS.RAISE:
          const raiseAmount = amount; // Total bet amount
          const added = raiseAmount - player.currentBet;
          this.placeBet(this.currentPlayerIndex, added);
          this.addLog(`${player.name} 加注至 ${raiseAmount}`);
          break;
        case PLAYER_ACTIONS.ALL_IN:
          this.placeBet(this.currentPlayerIndex, player.chips);
          this.addLog(`${player.name} 全下！`);
          break;
      }
      
      this.nextTurn();
    },

    aiMove(player) {
      // Simple AI Logic
      const hand = evaluateHand(player.hand, this.communityCards);
      const score = hand.score;
      const callAmount = this.currentBet - player.currentBet;
      const potOdds = callAmount / (this.pot + callAmount);
      
      // Random factor
      const r = Math.random();

      // Very basic strategy based on hand strength and stage
      let action = PLAYER_ACTIONS.FOLD;
      let amount = 0;

      // Pre-flop logic
      if (this.gameStage === GAME_STAGES.PRE_FLOP) {
        const highCard = Math.max(player.hand[0].value, player.hand[1].value);
        const isPair = player.hand[0].value === player.hand[1].value;
        
        if (isPair || highCard >= 12 || (highCard >= 10 && r > 0.5)) {
          if (callAmount === 0) action = PLAYER_ACTIONS.CHECK;
          else action = PLAYER_ACTIONS.CALL;
          
          if (isPair && player.hand[0].value >= 10 && r > 0.7) {
             action = PLAYER_ACTIONS.RAISE;
             amount = this.currentBet + this.minRaise;
          }
        } else {
          if (callAmount === 0) action = PLAYER_ACTIONS.CHECK;
          else if (callAmount < this.bigBlind * 2 && r > 0.8) action = PLAYER_ACTIONS.CALL; // Bluff/Loose
          else action = PLAYER_ACTIONS.FOLD;
        }
      } else {
        // Post-flop logic
        if (hand.rank >= HAND_RANKS.PAIR) {
           if (callAmount === 0) {
             if (r > 0.6) {
               action = PLAYER_ACTIONS.RAISE;
               amount = this.currentBet + this.minRaise;
             } else {
               action = PLAYER_ACTIONS.CHECK;
             }
           } else {
             action = PLAYER_ACTIONS.CALL;
             if (hand.rank >= HAND_RANKS.THREE_OF_A_KIND && r > 0.5) {
               action = PLAYER_ACTIONS.RAISE;
               amount = this.currentBet + this.minRaise * 2;
             }
           }
        } else {
           // Weak hand
           if (callAmount === 0) action = PLAYER_ACTIONS.CHECK;
           else if (r > 0.9) action = PLAYER_ACTIONS.CALL; // Bluff
           else action = PLAYER_ACTIONS.FOLD;
        }
      }

      // Sanity check
      if (action === PLAYER_ACTIONS.RAISE && player.chips < amount) {
        action = PLAYER_ACTIONS.ALL_IN;
      }
      if (action === PLAYER_ACTIONS.CALL && player.chips < callAmount) {
        action = PLAYER_ACTIONS.ALL_IN;
      }

      this.playerAction(action, amount);
    },

    resolveShowdown() {
      const activePlayers = this.players.filter(p => p.status !== 'folded' && p.status !== 'out');
      this.resolveWinner(activePlayers);
    },

    resolveWinner(candidates) {
      candidates.forEach(p => {
        p.handRank = evaluateHand(p.hand, this.communityCards);
      });

      // Sort by score descending
      candidates.sort((a, b) => b.handRank.score - a.handRank.score);
      
      const bestScore = candidates[0].handRank.score;
      const winners = candidates.filter(p => p.handRank.score === bestScore);
      
      const winAmount = Math.floor(this.pot / winners.length);
      winners.forEach(w => {
        w.chips += winAmount;
        this.addLog(`${w.name} 以 ${w.handRank.name} 赢得 ${winAmount} 筹码！`);
      });
      
      this.winners = winners;
      sounds.win.play();
      
      // Prepare Round Result Data
      const human = this.players.find(p => p.isHuman);
      const netIncome = human.chips - this.playerStartChips;
      
      // Update History
      this.chipHistory.push({
        round: this.roundCount,
        chips: human.chips
      });

      this.roundResult = {
        winners: winners.map(w => ({
          name: w.name,
          handRank: w.handRank.name,
          cards: w.hand,
          winAmount: winAmount
        })),
        playerHand: human.hand,
        playerHandRank: human.handRank ? human.handRank.name : '已弃牌',
        netIncome: netIncome,
        communityCards: this.communityCards
      };

      // Show result panel instead of auto-restart
      this.showRoundResult = true;
      
      // Auto start removed, waiting for user action in UI
    },

    addLog(message) {
      this.logs.unshift({ time: new Date().toLocaleTimeString(), message });
      if (this.logs.length > 50) this.logs.pop();
    },

    nextHand() {
      this.startNewHand();
    }
  }
});