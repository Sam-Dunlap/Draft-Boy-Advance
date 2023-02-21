const { SlashCommandBuilder } = require("discord.js");
const { spreadsheetId } = require('../config.json');
const { google } = require('googleapis')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('pickorder')
        .setDescription('Returns the current pick order')
        .setDefaultMemberPermissions('0')
    ,
    async execute(interaction) {
        const auth = new google.auth.GoogleAuth({
            keyFile: "./credentials.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets"
        });
        const gclient = await auth.getClient();
        const googleSheets = google.sheets({ version: "v4", auth: gclient });

        const data = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            majorDimension: "COLUMNS",
            range: "PickOrder!A1:A"
        });

        const order = data.data.values[0];

        if (!order) {
            await interaction.reply('No one has been added to the pick order yet.');
            return;
        }

        let textFormattedOrder = '\n';

        for (let i = 1; i <= order.length; i++) {
            textFormattedOrder += `${i}. ${order[i - 1]}\n`
        }

        await interaction.reply({content: `The current pick order is ${textFormattedOrder}`, ephemeral: true});

    }
}