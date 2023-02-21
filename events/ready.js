const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		const channelCache = client.channels.cache
		const mainChannel = channelCache.find(channel => channel.name === 'general');
		mainChannel.send('Bing Bong. This is the default output channel. Specify another one when you call /start if you would like my output to appear elsewhere.');
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};