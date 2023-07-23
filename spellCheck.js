module.exports = {
	spellCheck(pick, validPicks) {
		let bestGuess = "Unown";
		let score = 0;
		validPicks.forEach(pokemon => {
			let checkScore = 0;
			for (let i = 0; i < pick.length; i++) {
				if ((pokemon[i] || "").toUpperCase() === pick[i])
					checkScore += 1;
			}
			if (checkScore > score) {
				bestGuess = pokemon;
				score = checkScore;
			}
		});
		return bestGuess;
	}
};
// can improve this. if the pokemon string .contains() groups of letters from the pick
// (which can be recursed for larger and larger groups) then it is more likely to be
// the intended pick. low priority.
