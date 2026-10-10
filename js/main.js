//util reference
const MASTERDECK = []



let highestScore;//highest score ever achieved
//let highestRoundScore; //idr what this is ignore for now
const SCORESTOBEAT = [1, 20, 30, 40, 60, 70, 80, 100, 120, 140, 150]//0 index with 0 being for the tutorial
let settings = {"visual":"dark", "readerMode":"normal",
    "mode": "normal"}//reference to settings and wtv is in there

//game layer
const gameState = {
    screen: "start", // start, play, shop, end

    run: {
        roundNumber: 0,
        kosekBucks: 0,
        maxScore: 0,
        throughScores: []
    },

    round: {
        startedAt: 0,
        elapsedMs: 0,
        roundScore: 0,
        scoreToBeat: 0
    }
};

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
    
    calculateTotal() {
        for(const card of this.cards){
            total += card.rank === "A" ? 11 : card.value;

            if(card.rank === "A") aces++;
        }

        while(total > 21 && aces > 0){
            total -= 10;
            aces--;
        }

        this.total = total;

        if(total > 21){
            this.state = false;
            this.status = "bust";
        }

        return total;
    }
}

//upgrade layer
let upgrades = [{"scoreMultiplier":1}, {"owned":ownedUpgrades}, {"timeDecayReduction":0}, 
    {"safetyNet":false}, {"pauseTime":false}, {"startWithSplit":false}, {"seeNextCard":0}]
let ownedUpgrades = []









//Shop
//Buttons
function selectMultiplier(multi) { 
    //Assuming multipliers is a dictionary 
    //Assuming var name is currentMultiplier
    currentMultiplier += mulipliers[multi];

    //Assuming shopCosts is a dictionary
    //Assuming var name is currKosekBucks
    curr
}




//Scoring Systems
function calculateHandScore(total, elapsedMs, multiplier) {
    // A bust scores zero
    if (total > 21 || total <= 0) return 0;

    const elapsedSeconds = elapsedMs / 1000;
    const distancePenalty = 5 * Math.abs(21 - total);
    const timePenalty = Math.floor(Math.max(0, elapsedSeconds - 5) / 0.5);
    const baseScore = Math.max(0,100 - distancePenalty - timePenalty);

    return Math.floor(baseScore * multiplier);
}
