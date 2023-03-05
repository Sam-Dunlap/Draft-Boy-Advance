const { google } = require('googleapis');
const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const { spreadsheetId } = require('../config.json')

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Add To Draft')
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions("0"),
    async execute(interaction) {
        const { username } = interaction.targetUser;

        if (!interaction.guild.roles.cache.find(r => r.name === 'Drafter')) {
            await interaction.guild.roles.create({
                name: 'Drafter',
                color: 'BLUE',
                reason: 'Active drafters will be assigned this role',
                mentionable: true
            }).catch(console.error);
        };

        const role = interaction.guild.roles.cache.find(r => r.name === 'Drafter');
        const member = await interaction.guild.members.fetch(interaction.targetUser.id);
        member.roles.add(role);

        await interaction.reply({content: `${username} has been added to the draft lineup.`, ephemeral: true})

        const auth = new google.auth.GoogleAuth({
            keyFile: "./credentials.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets"
        });

        const gclient = await auth.getClient();

        const googleSheets = google.sheets({ version: "v4", auth: gclient });

        googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range: "PickOrder!A:A",
            valueInputOption: "RAW",
            resource: {
                values: [
                    [username]
                ]
            }
        });
    }
}