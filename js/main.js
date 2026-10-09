//util reference
const MASTERDECK = []



let highestScore;//highest score ever achieved
//let highestRoundScore; //idr what this is ignore for now
const SCORESTOBEAT = [1, 20, 30, 40, 60, 70, 80, 100, 120, 140, 150]//0 index with 0 being for the tutorial
let settings = [{"visual":"dark"}, {"readerMode":"normal"},
    {"mode": "normal"}]//reference to settings and wtv is in there
let throughScores = [] //array of scores with 0 being tutorial and 1-1 etc

//game layer
let gameState = [{"screen":"start"}, {"run": currRun},{"round" : "currRound"}]//screens can be start, play, end
let currRun = [{"roundNumber":0}, {"kosekBucks":0}];
let currRound =[{"startAt":getTime()}, {"elapsedMs":(getTime()-currRound[startAt])}, 
    {"roundScore":0}, ]
let scoreToBeat = SCORESTOBEAT[currRun[round]]

//blackjack layer
class Card {
    constructor(suit, rank, value, faceup, id) {
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
    }
    
    calculateTotal() {
        let tempTotal = 0;
        let aces = 0;

        for(let card of this.cards) {
            tempTotal += card.value;
            if (card.rank === 'A') aces++;
        }

        //Aces conundrum 

        return tempTotal;
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

function 



//Scoring Systems
