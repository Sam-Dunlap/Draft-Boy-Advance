const { EmbedBuilder } = require("@discordjs/builders");
const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle
} = require("discord.js");
const { Poll, startPoll } = require("../pollCollector");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("poll")
		.setDescription(
			"Poll for rule changes. Use `Apps => Close` in context menu to record results."
		)
		.setDefaultMemberPermissions("0")
		.addStringOption(o =>
			o
				.setName("title")
				.setDescription("The poll title")
				.setRequired(true)
		)
		.addStringOption(o =>
			o
				.setName("option1")
				.setDescription("the first option")
				.setRequired(true)
		)
		.addStringOption(o =>
			o
				.setName("option2")
				.setDescription("the second option")
				.setRequired(true)
		)
		.addBooleanOption(o =>
			o
				.setName("hidden")
				.setDescription(
					"hide results until poll closes - default false"
				)
		)
		.addBooleanOption(o =>
			o
				.setName("multivote")
				.setDescription("cast multiple votes? default false")
		),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const title = interaction.options.getString("title");
		const option1 = interaction.options.getString("option1");
		const option2 = interaction.options.getString("option2");
		const hidden = interaction.options.getBoolean("hidden");
		const multi = interaction.options.getBoolean("multivote");
		const responseChannel = await interaction.client.channels.cache.get(
			interaction.channelId
		);

		const message = await responseChannel.send({
			content: "Building poll..."
		});

		const poll = new Poll({
			title,
			message,
			hidden,
			voters: [],
			option1: {
				name: option1,
				votes: 0
			},
			option2: {
				name: option2,
				votes: 0
			},
			multi
		});
		message.edit(poll.buildPoll());
		startPoll(poll);
		return interaction.editReply(`Poll built.`);
	}
};
