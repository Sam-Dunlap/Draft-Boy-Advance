module.exports = {
  validateTier(tiers, pokemon, cache) {
    const flex = cache.flex;
    if (!flex) {
      if (tiers[Number(pokemon[1]) - 1] >= cache.tiers[Number(pokemon[1]) - 1])
        return false;
      return true;
    } else {
      let valid = false;
      console.log(pokemon);
      for (let i = 0; i < Number(pokemon[1]) - 1; i++) {
        if (tiers[i] <= cache.tiers[i]) valid = true;
      }
      return valid;
    }
  },
};
