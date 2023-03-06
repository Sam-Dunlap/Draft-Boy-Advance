const { Events } = require('discord.js');
const pollCollector = require('../pollCollector')

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {

		if (interaction.isButton()) {
			try {
				await pollCollector.buttonPressed(interaction)
			} catch (error) {
				console.error(`Error executing button interaction`)
				console.error(error)
			}
			return;
		}

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}
	},
};