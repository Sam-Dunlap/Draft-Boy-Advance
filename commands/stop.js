const { SlashCommandBuilder } = require("discord.js");
const { deleteCache, getCacheWithGuildId } = require("../Cache");
const { google } = require('googleapis');
const { spreadsheetId } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('stops the draft')
        .setDefaultMemberPermissions('0')
    ,

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
            range: "Sheet1!A2:B"
        })


        const cache = deleteCache(getCacheWithGuildId(interaction.guild.id))[0];
        if (!cache) {
            console.log('no cache');
            await interaction.reply('it is done');
            return;
        }
        console.log(
`           ////////////////////////////////
            ////////// Cache Data //////////
            player count: ${cache.playerCount}
            pick order: ${cache.pickOrder}
            team size: ${cache.teamSize}
            ////////////////////////////////`);
            await interaction.reply('it is done');

    }
}