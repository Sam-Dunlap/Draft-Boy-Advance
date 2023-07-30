module.exports = {
	validateTier(tiers, pokemon, cache) {
		const flex = cache.flex;
		if (!flex) {
			if (
				tiers[Number(pokemon[1]) - 1] >=
				Number(cache.tiers[Number(pokemon[1]) - 1])
			)
				return false;
			return true;
		} else {
			const pkmnTierIdx = Number(pokemon[1]) - 1; // corresponds to the array index of each tier. !== the actual pokemon tier which is 1-indexed
			let higherTiersWithFreeSlots = 0;
			for (let i = 0; i < pkmnTierIdx; i++) {
				if (tiers[i] < Number(cache.tiers[i]))
					higherTiersWithFreeSlots += 1;
			}

			let lowerTiersExceedingSlots = 0;
			for (let i = pkmnTierIdx + 1; i < tiers.length; i++) {
				if (tiers[i] > Number(cache.tiers[i]))
					lowerTiersExceedingSlots += 1;
			}

			return (
				Number(cache.tiers[pkmnTierIdx]) +
					higherTiersWithFreeSlots -
					lowerTiersExceedingSlots >
				Number(tiers[pkmnTierIdx])
			);
		}
	}
};
