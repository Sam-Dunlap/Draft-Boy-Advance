module.exports = {
	validateTier(tiers, pokemon, cache) {
		const flex = cache.flex;
		if (!flex) {
			return !(
				tiers[Number(pokemon[1]) - 1] >=
				Number(cache.tiers[Number(pokemon[1]) - 1])
			)
		} else {
			// basically, if there are any open slots from the tier of the pokemon or ANY higher tiers, return true, otherwise false
			// i.e. the sum of picks so far in the chosen tier + higher tiers cannot exceed the sum of available picks


			const pkmnTierIdx = Number(pokemon[1]) - 1; // corresponds to the array index of each tier. !== the actual pokemon tier which is 1-indexed
			let maxOfTier = 0;
			let alreadyLocked = 0;
			for (let i = 0; i <= pkmnTierIdx; i++) {
				maxOfTier += Number(cache.tiers[i]);
				alreadyLocked += tiers[i];
			}
			let availableFlex = maxOfTier - alreadyLocked > 0;
			if (!availableFlex) return false;
			// end of step 1


			let tempTiers = tiers.slice();
			tempTiers[pkmnTierIdx] += 1;
			tempTiers = tempTiers.reverse();
			let numericCacheTiers = cache.tiers.map(n => Number(n));
			let totalFlexSlots = new Array(tempTiers.length);
			for (let i = 0; i < tempTiers.length; i++) {
				if (i == 0) {
					totalFlexSlots[i] = numericCacheTiers[i]
				} else {
					totalFlexSlots[i] = numericCacheTiers[i] + totalFlexSlots[i-1];
				}
			}
			totalFlexSlots.reverse()
			let notOverstockedBelow = true;
			for (let i = 0; i < totalFlexSlots.length; i++) {
				let temperTiers = tempTiers.slice(i);
				let totalUsedSlots = temperTiers.reduce((acc, curr) => acc + curr);
				if (totalUsedSlots > totalFlexSlots[i]) {
					notOverstockedBelow = false;
				};
			}
			return (availableFlex && notOverstockedBelow)
		}
	}
};


// the max number of pokemon you can legally have from a tier n is given by sum(tier[0], ... , tier[n])
// 1. calculate that number for the tier of the pokemon being checked
// 2. subtract from that number the number of already locked in pokemon from tiers 0-n
// 3. if the result is less than 0, invalid
// 4. start at the lowest tier, find x: the number of pokemon in that tier greater than its allotment. if x <= 0 we are done with this tier.
// 5. go up one tier, find y: the number of pokemon in that tier fewer than its allotment. if x - y <= 0, we are done with this tier.
// 6. otherwise, go up another tier, repeat step 5, but x is now x - y
// 7. once x - y <= 0, we know that every tier below the one we stopped at is out of slots, and at least one slot from the tier we stopped at is being used as a flex