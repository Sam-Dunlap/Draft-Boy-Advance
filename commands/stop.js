const { SlashCommandBuilder } = require("discord.js");
const { deleteCache, getCacheWithGuildId } = require("../Cache");
const { google } = require("googleapis");
const { spreadsheetId } = require("../config.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("stops the draft")
		.setDefaultMemberPermissions("0"),
	async execute(interaction) {
		const auth = new google.auth.GoogleAuth({
			keyFile: "./credentials.json",
			scopes: "https://www.googleapis.com/auth/spreadsheets"
		});
		const gclient = await auth.getClient();
		const googleSheets = google.sheets({ version: "v4", auth: gclient });

		googleSheets.spreadsheets.values.clear({
			auth,
			spreadsheetId,
			range: "Master!A2:B"
		});

		const cache = deleteCache(getCacheWithGuildId(interaction.guild.id))[0];

		console.log(
			`${new Date().toLocaleTimeString()} - 
        //////////////////////////////////////////
        Draft Stopped
        player count: ${cache ? cache.playerCount : "No cache data to display"}
        pick order: ${cache ? cache.pickOrder : "No cache data to display"}
        team size: ${cache ? cache.teamSize : "No cache data to display"}
        //////////////////////////////////////////
            `
		);
		await interaction.reply("it is done");
	}
};
