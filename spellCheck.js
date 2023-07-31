recursiveCheck = (searchFromIdx, hasBeenFound, pick, pokemon, score) => {
	// hasBeenFound is an array with length == pick.length, initially filled with false
	// pick is user input text

	// base case
	if (searchFromIdx == pick.length) return score;

	let tempScore = 0;
	for (let i = searchFromIdx + 2; i <= pick.length; i++) {
		while (hasBeenFound[i]) {
			i += 1;
		}
		if (!pokemon.includes(pick.slice(searchFromIdx, i))) break;

		// otherwise we found a match somewhere, so set hasBeenFound at these indices, increase score and check one string longer
		hasBeenFound.fill(true, searchFromIdx, i);
		tempScore += 1;
	}
	if (tempScore > score) score = tempScore;
	searchFromIdx += 1;
	return recursiveCheck(searchFromIdx, hasBeenFound, pick, pokemon, score);
};

module.exports = {
	spellCheck(pick, validPicks) {
		let bestGuess = "Unown";
		let score = 0;
		validPicks.forEach(pokemon => {
			let checkScore = recursiveCheck(
				0,
				Array.from(pick).fill(false),
				pick,
				pokemon.toUpperCase(),
				score
			);
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
