const cacheContainer = [];

module.exports = {
    cacheContainer,
    getCacheWithGuildId: (guildId) => {
        const cache = cacheContainer.find(c => c.guildId === guildId);
        return cache;
    },
    saveCache: (cache) => {
        cacheContainer.push(cache);
        console.log(`[CACHE]: ${cache.guildId} saved`)
    },
    deleteCache: (cache) => {
        const idx = cacheContainer.find(c => c === cache);
        console.log(`[CACHE]: ${cache.guildId} deleted`)
        return cacheContainer.splice(idx, 1);
    },
    
    Cache: class Cache {
        constructor(outputChannelId, pickOrder, playerCount, guildId, teamSize) {
            this.outputChannel = outputChannelId;
            this.pickOrder = pickOrder;
            this.playerCount = playerCount;
            this.guildId = guildId;
            this.teamSize = teamSize;
        };

    }
}