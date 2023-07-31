const { SlashCommandBuilder, userMention } = require("discord.js");
const { google } = require("googleapis");
const { getCacheWithGuildId } = require("../Cache");
const { spreadsheetId } = require("../config.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("goto")
		.setDescription(
			"Use this command to move the draft to a specific pick number."
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("back")
				.setDescription("Use in case of illegal picks")
				.addNumberOption(option =>
					option
						.setName("picknumber")
						.setDescription("The pick number to rewind to")
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand.setName("next").setDescription("Skip 1 player")
		)
		.setDefaultMemberPermissions("0"),

	async execute(interaction) {
		const cache = getCacheWithGuildId(interaction.guild.id);
		if (!cache) {
			await interaction.reply({
				content: "You do not appear to be in a live draft.",
				ephemeral: true
			});
			return;
		}
		const pickNumber = interaction.options.getNumber("picknumber");

		const auth = new google.auth.GoogleAuth({
			keyFile: "./credentials.json",
			scopes: "https://www.googleapis.com/auth/spreadsheets"
		});
		const gclient = await auth.getClient();
		const googleSheets = google.sheets({ version: "v4", auth: gclient });

		if (!pickNumber) {
			await interaction.reply({
				content: `Skipping 1 player`,
				ephemeral: true
			});
			const sheetData = await googleSheets.spreadsheets.values.get({
				auth,
				spreadsheetId,
				range: "BotData!A2"
			});
			const n = sheetData.data.values[0][0];
			googleSheets.spreadsheets.values.append({
				auth,
				spreadsheetId,
				range: `Master!A2:B`,
				valueInputOption: "RAW",
				resource: {
					values: [["*", "Skipped"]]
				}
			});
			googleSheets.spreadsheets.values.update({
				auth,
				spreadsheetId,
				range: "BotData!A2:B2",
				valueInputOption: "RAW",
				resource: {
					values: [[`${Number(n) + 1}`]]
				}
			});
			return console.log(
				`${new Date().toLocaleTimeString()} - player skipped`
			);
		}

		const rawNandCoach = await googleSheets.spreadsheets.values.batchGet({
			auth,
			spreadsheetId,
			ranges: ["BotData!A2", `Master!B${pickNumber + 1}`]
		});

		const n = rawNandCoach.data.valueRanges[0].values[0][0];
		const coach = rawNandCoach.data.valueRanges[1].values[0][0];

		if (pickNumber > n) {
			await interaction.reply({
				content:
					"I am unable to fast-forward drafts, I can only rewind them. Please try again with a smaller pick number.",
				ephemeral: true
			});
			return;
		}

		await interaction.reply("rewinding...");

		googleSheets.spreadsheets.values.clear({
			auth,
			spreadsheetId,
			range: `Master!A${pickNumber + 1}:B`
		});

		googleSheets.spreadsheets.values.update({
			auth,
			spreadsheetId,
			range: `BotData!A2`,
			valueInputOption: "RAW",
			resource: {
				values: [[pickNumber]]
			}
		});

		const guildMembers = await interaction.guild.members.fetch();
		const guildMembersFormatted = guildMembers.map(m => m.user);
		const drafter = guildMembersFormatted.find(
			user => user.username == coach
		);
		const channel = await interaction.guild.channels.fetch(
			cache.outputChannel
		);
		await channel.send(
			`${userMention(drafter.id)}, it is now your turn to pick.`
		);
	}
};
