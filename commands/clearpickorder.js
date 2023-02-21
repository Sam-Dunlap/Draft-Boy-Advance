const { SlashCommandBuilder } = require("discord.js");
const { getCacheWithGuildId } = require("../Cache");
const { spreadsheetId } = require('../config.json');
const { google } = require('googleapis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearpickorder')
        .setDescription('removes all players from the pick order.')
    ,
    async execute(interaction) {
        const cache = getCacheWithGuildId(interaction.guild.id);
        if (cache) {
            await interaction.reply('Clearing the pick order while in a live draft is a recipe for disaster. You should take a long, hard look at yourself, and then try running this command again once the draft is complete.');
            return;
        };
        const drafterRole = interaction.guild.roles.cache.find(role => role.name === 'Drafter');

        if (drafterRole) {
            const users = await interaction.guild.members.fetch();
            const mappedUsers = users.map(u => u)
            mappedUsers.forEach(user => user.roles.remove(drafterRole));
        }
        
        const auth = new google.auth.GoogleAuth({
            keyFile: "./credentials.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets"
        });
        const gclient = await auth.getClient();
        const googleSheets = google.sheets({ version: "v4", auth: gclient });
        
        googleSheets.spreadsheets.values.clear({
        auth,
        spreadsheetId,
        range: "PickOrder!A1:A"
        });

        await interaction.reply('Pick order cleared.');
    }
}