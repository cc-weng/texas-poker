import _ from 'lodash';

export const SUITS = ['H', 'D', 'C', 'S']; // Hearts, Diamonds, Clubs, Spades
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A'];

// Rank values for comparison
const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '0': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const HAND_RANKS = {
  HIGH_CARD: 1,
  PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10
};

export const HAND_NAMES = {
  1: '高牌',
  2: '一对',
  3: '两对',
  4: '三条',
  5: '顺子',
  6: '同花',
  7: '葫芦',
  8: '四条',
  9: '同花顺',
  10: '皇家同花顺'
};

export class Card {
  constructor(rank, suit) {
    this.rank = rank;
    this.suit = suit;
    this.value = RANK_VALUES[rank];
  }

  toString() {
    return `${this.rank}${this.suit}`;
  }

  getImageUrl() {
    return `https://deckofcardsapi.com/static/img/${this.rank}${this.suit}.png`;
  }
}

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(new Card(rank, suit));
    }
  }
  return deck;
}

export function shuffleDeck(deck) {
  return _.shuffle(deck);
}

export function preloadDeckImages(onProgress) {
  const deck = createDeck();
  const total = deck.length;
  let loaded = 0;

  const promises = deck.map(card => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = card.getImageUrl();
      img.onload = () => {
        loaded++;
        if (onProgress) onProgress(loaded / total);
        resolve();
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${img.src}`);
        loaded++;
        if (onProgress) onProgress(loaded / total);
        resolve();
      };
    });
  });

  return Promise.all(promises);
}

// Evaluates the best 5-card hand from 7 cards (2 hole cards + 5 community cards)
export function evaluateHand(holeCards, communityCards) {
  const allCards = [...holeCards, ...communityCards];
  if (allCards.length < 5) return { rank: 0, name: '等待中', score: 0 };

  // Get all combinations of 5 cards from the available cards
  const combinations = getCombinations(allCards, 5);
  let bestHand = null;

  for (const hand of combinations) {
    const result = evaluate5CardHand(hand);
    if (!bestHand || result.score > bestHand.score) {
      bestHand = result;
    }
  }

  return bestHand;
}

function getCombinations(array, k) {
  if (k === 1) return array.map(element => [element]);
  const combinations = [];
  const n = array.length;
  for (let i = 0; i < n - k + 1; i++) {
    const head = array.slice(i, i + 1);
    const tailCombinations = getCombinations(array.slice(i + 1), k - 1);
    for (const tail of tailCombinations) {
      combinations.push(head.concat(tail));
    }
  }
  return combinations;
}

function evaluate5CardHand(cards) {
  // Sort by value descending
  const sortedCards = [...cards].sort((a, b) => b.value - a.value);
  
  const isFlush = sortedCards.every(c => c.suit === sortedCards[0].suit);
  
  // Check straight
  let isStraight = true;
  for (let i = 0; i < 4; i++) {
    if (sortedCards[i].value - sortedCards[i+1].value !== 1) {
      isStraight = false;
      break;
    }
  }
  // Special case: A-5-4-3-2
  if (!isStraight && sortedCards[0].value === 14 && sortedCards[1].value === 5 && sortedCards[2].value === 4 && sortedCards[3].value === 3 && sortedCards[4].value === 2) {
    isStraight = true;
    // Move Ace to end for correct comparison logic if needed, but for score calculation we handle it
  }

  const values = sortedCards.map(c => c.value);
  const valueCounts = _.countBy(values);
  const counts = Object.values(valueCounts).sort((a, b) => b - a);
  
  let rank = HAND_RANKS.HIGH_CARD;
  let kickers = values;

  if (isFlush && isStraight) {
    rank = (values[0] === 14 && values[1] === 13) ? HAND_RANKS.ROYAL_FLUSH : HAND_RANKS.STRAIGHT_FLUSH;
    if (values[0] === 14 && values[1] === 5) {
        kickers = [5, 4, 3, 2, 1]; // Treat Ace as 1 for Steel Wheel
    }
  } else if (counts[0] === 4) {
    rank = HAND_RANKS.FOUR_OF_A_KIND;
    // Kickers: Quad value, then single value
    const quadValue = parseInt(Object.keys(valueCounts).find(key => valueCounts[key] === 4));
    const singleValue = parseInt(Object.keys(valueCounts).find(key => valueCounts[key] === 1));
    kickers = [quadValue, singleValue];
  } else if (counts[0] === 3 && counts[1] === 2) {
    rank = HAND_RANKS.FULL_HOUSE;
    const tripValue = parseInt(Object.keys(valueCounts).find(key => valueCounts[key] === 3));
    const pairValue = parseInt(Object.keys(valueCounts).find(key => valueCounts[key] === 2));
    kickers = [tripValue, pairValue];
  } else if (isFlush) {
    rank = HAND_RANKS.FLUSH;
  } else if (isStraight) {
    rank = HAND_RANKS.STRAIGHT;
    // Handle 5-high straight (A-2-3-4-5)
    if (values[0] === 14 && values[1] === 5) {
        kickers = [5, 4, 3, 2, 1]; // Treat Ace as 1
    }
  } else if (counts[0] === 3) {
    rank = HAND_RANKS.THREE_OF_A_KIND;
    const tripValue = parseInt(Object.keys(valueCounts).find(key => valueCounts[key] === 3));
    const others = values.filter(v => v !== tripValue);
    kickers = [tripValue, ...others];
  } else if (counts[0] === 2 && counts[1] === 2) {
    rank = HAND_RANKS.TWO_PAIR;
    const pairs = Object.keys(valueCounts).filter(key => valueCounts[key] === 2).map(Number).sort((a, b) => b - a);
    const kicker = Object.keys(valueCounts).find(key => valueCounts[key] === 1);
    kickers = [...pairs, parseInt(kicker)];
  } else if (counts[0] === 2) {
    rank = HAND_RANKS.PAIR;
    const pairValue = parseInt(Object.keys(valueCounts).find(key => valueCounts[key] === 2));
    const others = values.filter(v => v !== pairValue);
    kickers = [pairValue, ...others];
  }

  // Calculate a unique score for comparison
  // Base score: rank * 10^10
  // Kickers add to the score in decreasing order of significance
  let score = rank * 10000000000;
  for (let i = 0; i < kickers.length; i++) {
    score += kickers[i] * Math.pow(100, 4 - i);
  }

  return {
    rank,
    name: HAND_NAMES[rank],
    score,
    cards: sortedCards
  };
}