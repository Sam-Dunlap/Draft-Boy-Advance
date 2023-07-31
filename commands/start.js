const { SlashCommandBuilder, userMention, ChannelType } = require("discord.js");
const { google } = require("googleapis");
const { saveCache, Cache, getCacheWithGuildId } = require("../Cache");
const { spreadsheetId } = require("../config.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("start")
		.setDescription("Use this command when you are ready to begin a draft.")
		.addChannelOption(option =>
			option
				.setName("outputchannel")
				.setDescription(
					"The channel you want draft picks to be recorded in"
				)
				.addChannelTypes(ChannelType.GuildText)
				.setRequired(true)
		)
		.addNumberOption(option =>
			option
				.setName("playercount")
				.setDescription("How many seats in the draft?")
				.setRequired(true)
		)
		.addNumberOption(option =>
			option
				.setName("teamsize")
				.setDescription("The size of each team's full roster")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("tierslots")
				.setDescription("Picks per tier, formatted as 1/2/3/4")
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option
				.setName("flex")
				.setDescription(
					"True if players can pick lower tier pokemon with higher tier slots"
				)
		)
		.setDefaultMemberPermissions("0"),

	async execute(interaction) {
		const outputChannel = interaction.options.getChannel("outputchannel");
		const teamSize = interaction.options.getNumber("teamsize");
		const playerCount = interaction.options.getNumber("playercount");
		const tierslots =
			interaction.options.getString("tierslots") || "99/99/99/99"; // if no tier slots specified, just set it to an arbitrarily large number so picks will go through regardless of tier
		const flex = interaction.options.getBoolean("flex");
		const tiers = tierslots.split("/");
		tiers.forEach(tier => {
			tier = Number(tier);
		});

		if (getCacheWithGuildId(interaction.guild.id)) {
			await interaction.reply(
				"There is already an active draft in this server. Currently, I am not able to track multiple drafts."
			);
			return;
		}

		await interaction.reply({
			content: "Preferences saved. Sending draft info to output channel.",
			ephemeral: true
		});

		const auth = new google.auth.GoogleAuth({
			keyFile: "./credentials.json",
			scopes: "https://www.googleapis.com/auth/spreadsheets"
		});
		const gclient = await auth.getClient();
		const googleSheets = google.sheets({ version: "v4", auth: gclient });

		const pickOrder = await googleSheets.spreadsheets.values.get({
			auth,
			spreadsheetId,
			range: "PickOrder!A:A"
		});

		const firstPickUserName = pickOrder.data.values[0][0];

		const queriedMember = await interaction.guild.members
			.fetch({ query: firstPickUserName, limit: 1 })
			.catch(console.error);
		const memberId = queriedMember.map(u => u.user.id)[0];

		await outputChannel.send(
			`${userMention(
				memberId
			)}, you're up first! Please use /pick to select your draft pick.`
		);

		const cache = new Cache(
			outputChannel.id,
			pickOrder.data.values.flat(),
			playerCount,
			interaction.guild.id,
			teamSize,
			tiers,
			flex
		);
		saveCache(cache);

		googleSheets.spreadsheets.values.update({
			auth,
			spreadsheetId,
			range: "BotData!A2:D2",
			valueInputOption: "RAW",
			resource: {
				values: [[1, playerCount, outputChannel.id, teamSize]]
			}
		});
		console.log(
			`${new Date().toLocaleTimeString()} - 
		//////////////////////////////////////////
		Draft Started
		player count: ${playerCount}
		output channel: ${outputChannel.name}
		team size: ${teamSize}
		tiers: ${tiers}
		flex: ${flex || "false"}
		//////////////////////////////////////////
		`
		);
	}
};
