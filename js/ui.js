$("btn-continue").addEventListener("click", () => {
    if(lastResult.cleared || lastResult.protected) { // handles new rounds
        continueRound();  // if user beat dealer, next round
    } else {
        endRun(); // else end the round
    }
});

$("btn-end-run").addEventListener("click", endRun); // failed rounds go to end screen and show final stats
$("btn-new-run").addEventListener("click", newRun); // new round button on end screen popup and money, rounds, upgrades reset