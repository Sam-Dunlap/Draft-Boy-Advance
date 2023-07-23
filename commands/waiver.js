const { SlashCommandBuilder } = require("discord.js");
const { validateTier } = require("../validateTier");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("waiver")
		.setDescription(
			"Switch a Pokemon on your squad with a Pokemon in the pool"
		)
		.addStringOption(option =>
			option
				.setName("from")
				.setDescription("The Pokemon on your squad")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("to")
				.setDescription("The Pokemon in the pool")
				.setRequired(true)
		),
	async execute(interaction) {
		const from = interaction.options.getString("from");
		const to = interaction.options.getString("to");

		await interaction.deferReply();

		const auth = new google.auth.GoogleAuth({
			keyFile: "./credentials.json",
			scopes: "https://www.googleapis.com/auth/spreadsheets"
		});
		const gclient = await auth.getClient();
		const googleSheets = google.sheets({ version: "v4", auth: gclient });
	}
};
