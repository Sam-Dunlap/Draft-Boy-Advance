const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		const channelCache = client.channels.cache
		const mainChannel = channelCache.find(channel => channel.name === 'general');
		mainChannel.send(':wave:');
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};