//util reference
const $ = (id) => document.getElementById(id);


let highestScore;//highest score ever achieved
let currentNotice = "";
let lastResult = null;
let timerInterval = null;
let currentTime = 0;


//let highestRoundScore; //idr what this is ignore for now
const SCORESTOBEAT = [1, 20, 30, 40, 60, 70, 80, 100, 120, 140, 150]//0 index with 0 being for the tutorial
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];
let settings = {
    "visual": "dark", 
    "readerMode": "normal",
    "mode": "normal",
    "confirmFold": false//flag for wtv is wanted
};

//game layer
const gameState = {
    screen: "start", // start, play, shop, end

    run: {
        roundNumber: 0,
        kosekBucks: 0,
        maxScore: 0,
        throughRecords: [],
        roundsCleared: 0,
        handsPlayed: 0
    },
    lifetime: {
        roundsCleared: 0,
        handsPlayed: 0,
        bestScore: 0
    },
    round: {
        roundScore: 0,
        scoreToBeat: SCORESTOBEAT[0],
        bet: 10, 
        active: false, 
        finished: false, 
        currentHand: 0, 
        currentTime: 0,
        hands: [], 
        deck: []
    },

    roundRecord: {
        roundNumber: 0,
        scoreToBeat: 0,
        roundScore: 0,
        handsPlayed: 0,
        kosekBucksEarned: 0
    },
    upgrades: {
            scoreMultiplier: 1,
            timeDecayReduction: 0,
            safetyNet: false,
            pauseTime: false,
            startWithSplit: false,
            seeNextCard: 0,
            addAce: false
        }
}

//blackjack layer
class Card {
    constructor(suit, rank, value, id) {
        this.id = id; //Written in form RANK-SUIT-VALUE
        this.value = value; //Numeric value of card for blackjack
        this.rank = rank; //2-10, J, Q, K, A
        this.suit = suit; 
        this.faceup = true;
    }
}

class Hand {
    constructor(id) { //Not quite sure what parameter should be 
        this.id = id;
        this.cards = [];
        this.total = 0; //Entire true value of the hand
        this.state = true; //true = alive, false = bust
        this.status = "playing"
    }
}


//Playing the game
function createDeck() { //Queue
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) {
    deck.push({ id: `${rank}-${suit}`, suit, rank, value: cardValue(rank), faceup: true }); 
  }
  if (gameState.upgrades && gameState.upgrades.addAce === true) {
    deck.push(new Card("★", "A", 11, "A-extra"));
    gameState.upgrades.addAce = false;
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]; //Probably should shuffle ?? yeah looks good
  }
  return deck;
}

function drawCard() {
  if (!gameState.round.deck.length) gameState.round.deck = createDeck();
  return gameState.round.deck.pop();
}

function makeHand(cards = [], id = 1) {
  return { id, cards, total: 0, state: true, status: "playing", stood: false, busted: false, bonus: 0 };
}

function activeHand() {
    return gameState.round.hands[gameState.round.currentHand]; 
}

function isPlayable(hand) { 
    return hand && hand.status === "playing" && !hand.busted && !hand.stood; 
}

function startRound() {
  gameState.round.currentTime = 0;
  if (gameState.round.active || gameState.round.finished) return;
  const bet = Number($("bet-amount").value);
  if (!Number.isFinite(bet) || bet <= 0 || bet > gameState.run.kosekBucks) {
    setNotice("You don't have enough Kosek Bucks for that bet.", "bad");
    return;
  }
  gameState.run.kosekBucks -= bet;
  gameState.round.bet = bet;
  gameState.round.deck = createDeck();
  const hand = makeHand([drawCard(), drawCard()], 1);
  gameState.round.hands = [hand];
  gameState.round.currentHand = 0;
  gameState.round.roundScore = 0;
  gameState.round.active = true;
  gameState.round.finished = false;
  
  // Start timer if you implemented timerInterval
  if (typeof startTimer === "function") startTimer();

  gameState.screen = "play";

  setNotice("Your hand is live. Make your move."); 
  if (handTotal(hand) === 21) {
    hand.status = "stood";
    hand.stood = true;
    finishRound("blackjack");
  } else {
    render();
  }
}

function advanceHandOrFinish() {
  const next = gameState.round.hands.findIndex((h, i) => i > gameState.round.currentHand && isPlayable(h));
  if(next >= 0) {
    gameState.round.currentHand = next;
    setNotice(`Now playing hand ${activeHand().id}.`);
    render();
    return;
  }
  const anyPlayable = gameState.round.hands.some(isPlayable);
  if (anyPlayable) {
    const index = gameState.round.hands.findIndex(isPlayable);
    gameState.round.currentHand = index;
    render();
    return;
  }
  finishRound("complete");
}

function finishRound(reason) {
  if (gameState.round.finished) return;
  gameState.round.active = false;
  gameState.round.finished = true;
  
  // Stop the timer when the round ends
  if (typeof stopTimer === "function") stopTimer();

  const handScores = gameState.round.hands.map(h => calculateHandScore(h.total, gameState.round.currentTime, gameState.upgrades.scoreMultiplier));
  const score = handScores.reduce((sum, n) => sum + n, 0);
  gameState.round.roundScore = score;
  gameState.run.maxScore = Math.max(gameState.run.maxScore, score);
  gameState.run.handsPlayed += gameState.round.hands.length;
  
  const cleared = score >= gameState.round.scoreToBeat;
  let earned = 0;
  
  if (cleared) {
    earned = gameState.round.bet * 2;
    gameState.run.kosekBucks += earned;
    gameState.run.roundsCleared++;
  } else if (gameState.upgrades.safetyNet) {
    gameState.upgrades.safetyNet = false;
    gameState._safetyNetJustUsed = true;
    setNotice("Safety Net absorbed the failed target. Your bet is still lost.", "bad");
  } else {
    gameState._safetyNetJustUsed = false;
  }
  
  const record = {
    roundNumber: gameState.run.roundNumber, 
    scoreToBeat: gameState.round.scoreToBeat,
    roundScore: score, 
    handsPlayed: gameState.round.hands.length,
    kosekBucksEarned: earned, 
    bet: gameState.round.bet, 
    result: cleared ? "Cleared" : (gameState._safetyNetJustUsed ? "Protected" : "Missed")
  };
  
  gameState.run.throughRecords.push(record);
  lastResult = { cleared, score, earned, reason, handScores, record, protected: !cleared && gameState._safetyNetJustUsed };
  render();
  showResultModal(lastResult);
}

function continueRound() {
  $("result-modal").classList.add("hidden");
  if (lastResult && (lastResult.cleared || lastResult.protected)) {
    gameState.run.roundNumber++;
    gameState.round.scoreToBeat = SCORESTOBEAT[gameState.run.roundNumber - 1] ?? (SCORESTOBEAT[SCORESTOBEAT.length - 1] + (gameState.run.roundNumber - SCORESTOBEAT.length) * 7);
    gameState.round.finished = false;
    gameState.round.active = false;
    gameState.round.hands = [];
    gameState.round.currentTime = 0;
    gameState.screen = "play";
    setNotice("Round cleared! Choose your bet and deal the next hand.");
    render();
  }
}

function endRun() {
  $("result-modal").classList.add("hidden");

  gameState.lifetime.roundsCleared += gameState.run.roundsCleared;
  gameState.lifetime.handsPlayed += gameState.run.handsPlayed;
  gameState.lifetime.bestScore = Math.max(gameState.lifetime.bestScore, gameState.run.maxScore);

  $("end-title").textContent = "The table is closed.";
  $("end-message").textContent = `You reached round ${gameState.run.roundNumber} and earned a best score of ${gameState.run.maxScore}.`;
  $("end-summary").innerHTML = `Rounds cleared: ${gameState.run.roundsCleared}<br>Hands played: ${gameState.run.handsPlayed}<br>Remaining Bucks: ${gameState.run.kosekBucks}<br>Best score: ${gameState.run.maxScore}`;
  
  $("end-modal").classList.remove("hidden");
  gameState.screen = "end";
  
  render();
}

function newRun() {
  gameState.run = { roundNumber: 1, kosekBucks: 50, maxScore: 0, throughRecords: [], roundsCleared: 0, handsPlayed: 0 };
  gameState.round = { roundScore: 0, scoreToBeat: SCORESTOBEAT[0], bet: 10, active: false, finished: false, currentHand: 0, hands: [], deck: [] };
  gameState.upgrades = { scoreMultiplier: 1, timeDecayReduction: 0, safetyNet: false, pauseTime: false, startWithSplit: false, seeNextCard: 0, editCardValue: false, addAce: false };
  gameState.owned = [];
  lastResult = null;
  $("end-modal").classList.add("hidden");
  setNotice("New run started. Choose a bet and deal.");
  render();
}
function showResultModal(res) {
    $("result-title").textContent = res.cleared ? "Round Cleared!" : (res.protected ? "Protected by Safety Net" : "Round Failed");
    $("result-desc").innerHTML = `Score: ${res.score} / Target: ${gameState.round.scoreToBeat}<br>${res.cleared ? `Earned: $${res.earned} Bucks` : "You missed the score target :("}`;
    $("result-modal").classList.remove("hidden");
}

function setNotice(message, type = "") {
  currentNotice = message;
  const el = $("status-message");
  if (el) { el.textContent = message; el.className = type ? `notice ${type}` : ""; }
}

document.addEventListener("keydown", event => {
  if(event.key.toLowerCase() === "k" && !gameState.round.active) {
    setNotice("♠ Easter egg: may the odds be ever in your favor.");
    render();
  }
});

newRun();

//defining render:
function render() {
    const moneyEl = $("money");
    if (moneyEl) moneyEl.textContent = gameState.run.kosekBucks;
    const shopMoneyEl = $("shop-money");
    if (shopMoneyEl) shopMoneyEl.textContent = gameState.run.kosekBucks;
    const scoreToBeatEl = $("score-to-beat");
    if (scoreToBeatEl) scoreToBeatEl.textContent = gameState.round.scoreToBeat;
    const multiplierEl = $("multiplier");
    if (multiplierEl) multiplierEl.textContent = `${gameState.upgrades.scoreMultiplier}x`;
    const statCleared = $("stat-cleared");
    if (statCleared) statCleared.textContent = gameState.lifetime.roundsCleared;
    const statHands = $("stat-hands");
    if (statHands) statHands.textContent = gameState.lifetime.handsPlayed;
    const statBest = $("stat-best");
    if (statBest) statBest.textContent = gameState.lifetime.bestScore;
    const statUpgrades = $("stat-upgrades");
    if (statUpgrades) {
      let activeUpgrades = [];
      if (gameState.upgrades.scoreMultiplier > 1) activeUpgrades.push(`${gameState.upgrades.scoreMultiplier}x Multiplier`);
      if (gameState.upgrades.safetyNet) activeUpgrades.push("Safety Net");
      if (gameState.upgrades.pauseTime) activeUpgrades.push("Pause Time");
      if (gameState.upgrades.startWithSplit) activeUpgrades.push("Split License");
      
      statUpgrades.textContent = activeUpgrades.length > 0 ? activeUpgrades.join(", ") : "None";
    }

    const playArea = $("play-area");
    if (playArea) {
        if(!gameState.round.active && gameState.round.hands.length === 0){
            playArea.innerHTML = "Play Area";
        }else{
            playArea.innerHTML = gameState.round.hands.map(hand => `
                <div class="hand-box">
                    <p>Hand ${hand.id} (Total: ${hand.total})</p>
                    <div class="cards">
                        ${hand.cards.map(card => `<span class="card">${card.rank}${card.suit}</span>`).join(' ')}
                    </div>
                </div>
            `).join('');
        }
    }
    const statRound = $("stat-round");
    if (statRound) statRound.textContent = gameState.run.roundNumber;
    
    const statBet = $("stat-bet");
    if (statBet) statBet.textContent = gameState.round.bet;
    
    const statLast = $("stat-last");
    if (statLast) statLast.textContent = lastResult ? lastResult.score : 0;
}

function startTimer() {
  clearInterval(timerInterval);
  gameState.round.currentTime = 0;
  timerInterval = setInterval(() => {
    if (gameState.round.active && !gameState.upgrades.pauseTime) {
      gameState.round.currentTime += 0.1; // Increment by 0.1 seconds
      const timeEl = $("time");
      if (timeEl) timeEl.textContent = gameState.round.currentTime.toFixed(1);
    }
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
}

//Action functions ?
function hit() {
  const hand = activeHand();
  if(!gameState.round.active || !isPlayable(hand)) return;
  hand.cards.push(drawCard());
  const total = handTotal(hand);
  if (total > 21) {
    setNotice(`Hand ${hand.id} busted at ${total}.`, "bad");
    advanceHandOrFinish();
  } else if(total === 21) {
    hand.status = "stood";
    hand.stood = true;
    setNotice(`Hand ${hand.id} reached 21.`);
    advanceHandOrFinish();
  } else {
    setNotice(`Drew ${hand.cards[hand.cards.length - 1].rank}.`);
    render();
  }
}

function stand() {
  const hand = activeHand();
  if (!gameState.round.active || !isPlayable(hand)) return;
  hand.stood = true;
  hand.status = "stood";
  setNotice(`Hand ${hand.id} stands on ${handTotal(hand)}.`);
  advanceHandOrFinish();
}

function fold() {
  const hand = activeHand();
  if (!gameState.round.active || !isPlayable(hand)) return;
  if (settings.confirmFold && !window.confirm("Fold this hand? It will score zero.")) return;
  hand.status = "Folded";
  hand.stood = true;
  setNotice(`Hand ${hand.id} folded.`, "bad");
  advanceHandOrFinish();
}

function split() {
  const hand = activeHand();
  if (!gameState.round.active || !isPlayable(hand) || hand.cards.length !== 2) return;
  const sameRank = hand.cards[0].rank === hand.cards[1].rank;
  if (!sameRank && !gameState.upgrades.startWithSplit) {
    setNotice("Split requires two cards of the same rank. Buy Split License to override.", "bad");
    return;
  }
  if(gameState.run.kosekBucks < gameState.round.bet) {
    setNotice("You need enough Bucks to match your bet for a split.", "bad");
    return;
  }
  gameState.run.kosekBucks -= gameState.round.bet;
  const [first, second] = hand.cards;
  const handA = makeHand([first, drawCard()], 1);
  const handB = makeHand([second, drawCard()], 2);
  gameState.round.hands.splice(gameState.round.currentHand, 1, handA, handB);
  gameState.round.currentHand = 0;
  setNotice("Split! Play each hand in turn.");
  render();
}

//Helper functions

function handTotal(hand) {
  let total = 0;
  let aces = 0;
  for (const card of hand.cards) {
    if(card.rank === "A") {
        total += 11;
     } else {
        total += card.value;
    } 
    if (card.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  hand.total = total;
  if (total > 21) {
    hand.state = false;
    hand.status = "bust";
    hand.busted = true;
  }
  return total;
}

//Shop
let ownedUpgrades = [];
let upgrades = [{"scoreMultiplier":1}, {"owned":ownedUpgrades}, {"timeDecayReduction":0}, 
    {"safetyNet":false}, {"pauseTime":false}, {"startWithSplit":false}, {"seeNextCard":0}];

function buyMultiplier(amount, cost) {
  if (gameState.run.kosekBucks < cost) {
    setNotice("Not enough Kosek Bucks!", "bad");
    return;
  }
  gameState.run.kosekBucks -= cost;
  gameState.upgrades.scoreMultiplier += amount;
  setNotice(`Purchased +${amount}x Multiplier!`, "good");
  render();
}

function buyCheat(cheatKey, cost) {
  if (gameState.run.kosekBucks < cost) {
    setNotice("Not enough Kosek Bucks!", "bad");
    return;
  }
  
  if (cheatKey === "safetyNet" || cheatKey === "pauseTime" || cheatKey === "startWithSplit" || cheatKey === "addAce") {
    if (gameState.upgrades[cheatKey] === true) {
      setNotice("You already own this upgrade!", "bad");
      return;
    }
    gameState.upgrades[cheatKey] = true;
  }

  gameState.run.kosekBucks -= cost;
  setNotice(`Successfully purchased ${cheatKey}!`, "good");
  render();
}

//Buttons
function selectMultiplier(multi) { 
    if (typeof multi === 'number') {
        gameState.upgrades.scoreMultiplier += multi;
        render();
    }
    if (typeof multipliers !== 'undefined' && multipliers[multi]) {
        currentMultiplier += multipliers[multi];
    }
}

//Scoring Systems
$("btn-deal").addEventListener("click", startRound);
$("btn-hit").addEventListener("click", hit);
$("btn-stand").addEventListener("click", stand);
$("btn-split").addEventListener("click", split);
$("btn-fold").addEventListener("click", fold);

function calculateHandScore(total, currentTime, multiplier = 1) {
    if (total > 21 || total <= 0) return 0;

    const distancePenalty = 5 * Math.abs(21 - total);
    
    // timeDecayReduction can reduce the penalty amount
    let timePenalty = currentTime * (1 - (gameState.upgrades.timeDecayReduction || 0));
    
    const baseScore = Math.max(0, 100 - distancePenalty - timePenalty);

    return Math.floor(baseScore * multiplier);
}

function cardValue(rank) {
  if (rank === "A") return 11;
  if(["J", "Q", "K"].includes(rank)) return 10;
  return Number(rank);
}