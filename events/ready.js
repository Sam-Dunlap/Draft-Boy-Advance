const { Events } = require("discord.js");

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(
			`${new Date().toLocaleTimeString()} - Ready! Logged in as ${
				client.user.tag
			}`
		);
	}
};
