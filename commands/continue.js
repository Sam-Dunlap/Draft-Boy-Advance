const { SlashCommandBuilder, userMention } = require("discord.js");
const { google } = require("googleapis");
const { spreadsheetId } = require("../config.json");
const { saveCache, Cache } = require("../Cache");
const { getDraftSeat } = require("../SnakeDraftEquations");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("continue")
		.setDescription(
			"pick the draft up from where it left off. use only if the bot crashed mid-draft"
		)
		.setDefaultMemberPermissions("0"),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const auth = new google.auth.GoogleAuth({
			keyFile: "./credentials.json",
			scopes: "https://www.googleapis.com/auth/spreadsheets"
		});
		const gclient = await auth.getClient();
		const googleSheets = google.sheets({ version: "v4", auth: gclient });

		const sheetData = await googleSheets.spreadsheets.values.batchGet({
			auth,
			spreadsheetId,
			ranges: ["BotData!A2:D2", "PickOrder!A:A"]
		});

		const n = sheetData.data.valueRanges[0].values[0][0];
		const teamSize = sheetData.data.valueRanges[0].values[0][3];
		const x = sheetData.data.valueRanges[0].values[0][1];
		const pickOrder = sheetData.data.valueRanges[1].values.flat();
		const outputChannelId = sheetData.data.valueRanges[0].values[0][2];

		const outputChannel = await interaction.guild.channels.fetch(
			outputChannelId
		);

		const cache = new Cache(
			outputChannelId,
			pickOrder,
			x,
			interaction.guild.id,
			teamSize
		);
		saveCache(cache);

		const y = getDraftSeat(n, x);
		const nextDrafter = await interaction.guild.members
			.fetch({ query: pickOrder[y - 1], limit: 1 })
			.catch(console.error);
		const drafterId = nextDrafter.map(u => u.user.id)[0];

		await interaction.editReply(
			`I think that your draft had ${x} players and was on pick number ${n}. Continuing from pick ${n}.`
		);

		return outputChannel.send(
			`${userMention(
				drafterId
			)}, you're up next. Lock in a pokemon with /pick.`
		);
	}
};
