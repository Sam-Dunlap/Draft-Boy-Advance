const {SlashCommandBuilder, userMention} = require('discord.js');
const { google } = require('googleapis');
const { spreadsheetId } = require('../config.json');
const { pendingPicks, UserPicks, addUsertoPendingPicks } = require('../PendingPicks');
const { stagePicks } = require('../ManageQueuedPicks');
const { getCacheWithGuildId, deleteCache } = require('../Cache');
const { getDraftSeat } = require('../SnakeDraftEquations');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pick')
        .setDescription('Lock in your draft pick')
        .addStringOption(option => 
            option.setName('pokemon')
                .setDescription('Your pick')
                .setRequired(true)),

    async execute(interaction) {
        const cache = getCacheWithGuildId(interaction.guild.id);
        
        if (!cache) {
            await interaction.reply(`I don't detect any live drafts in this server. Please have an admin run /start.`);
            return;
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: "./credentials.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets"
        });
        const gclient = await auth.getClient();
        const googleSheets = google.sheets({ version: "v4", auth: gclient });

        const sheetData = await googleSheets.spreadsheets.values.batchGet({
            auth,
            spreadsheetId,
            ranges: [
                "BotData!A2:C2",
                "Master!A2:A",
                "Master!H2:H"
            ]
        });

        const n = sheetData.data.valueRanges[0].values[0][0];
        const x = sheetData.data.valueRanges[0].values[0][1];
        const pickedData = sheetData.data.valueRanges[1].values;
        const validPicks = sheetData.data.valueRanges[2].values.flat();
        const outputChannel = await interaction.guild.channels.fetch(cache.outputChannel);
        const pokemonPick = interaction.options.getString('pokemon').toUpperCase();
        const y = getDraftSeat(n, x);

        await interaction.reply({content: `Making sure ${pokemonPick} is available...`, ephemeral: true});
        
        var pickedMons;

        pickedData ? pickedMons = pickedData.flat() : pickedMons = [];

        var foundDuplicatePick = false;
        
        pickedMons.forEach(mon => {
            if (mon === pokemonPick){
                foundDuplicatePick = true;
            }
        });
        
        const currentDrafter = cache.pickOrder[y - 1];

        const commandCaller = interaction.user.username;

        if (!validPicks.find(pick => pick.toUpperCase() === pokemonPick)) {
            await interaction.editReply(`I don't think ${pokemonPick} is a valid option. Please check your spelling and the legal pick list.`);
            return;
        }

        if (foundDuplicatePick) {
            await interaction.editReply({content: `${pokemonPick} has already been chosen in this draft. Please lock in a different Pokemon.`});
            return;
        };

        if (commandCaller === currentDrafter) {

            const values = [
                [pokemonPick, commandCaller]
            ];

            await interaction.editReply(`Success! You have drafted ${pokemonPick}.`);
            await outputChannel.send(`${interaction.user} has locked in ${pokemonPick}!`);
            pickedMons.push(pokemonPick)
            const { n1, nextPlayerName, stagedPicks } = stagePicks({n, x, guildId: interaction.guild.id, pickedMons});
            
            if (n1 > cache.teamSize * cache.playerCount) {
                deleteCache(cache);
                for (let i = 0; i < n1 - (cache.teamSize * cache.playerCount) - 1; i++) {
                    console.log('[REMOVED FROM STAGEDPICKS]: ', stagedPicks.pop());
                }
            };

            stagedPicks.forEach(pick => {
                values.push(pick);
            });

            stagedPicks.forEach(async pick => {
                const users = await interaction.guild.members.fetch({query: pick[1], limit: 1}).catch(console.error);
                const user = users.map(u => u.user)[0];
                await outputChannel.send(`${user} has locked in ${pick[0]}!`);
            });
            const queriedMember = await interaction.guild.members.fetch({query: nextPlayerName, limit: 1}).catch(console.error);
            const memberId = queriedMember.map(u => u.user.id)[0];

            googleSheets.spreadsheets.values.append({
                auth,
                spreadsheetId,
                range: "Master!A2:B",
                valueInputOption: "RAW",
                resource: {
                    values
                }
            });

            googleSheets.spreadsheets.values.update({
                auth,
                spreadsheetId,
                range: "BotData!A2",
                valueInputOption: "RAW",
                resource: {
                    values: [
                        [n1]
                    ]
                }
            });

            if (n1 > cache.teamSize * cache.playerCount) {
                deleteCache(cache);
                await outputChannel.send('The draft is complete. May the best mons win!');
                console.log(
                `
        //////////////////////////////////////////
        Draft Finished
        ${n-1} picks, I think.
        GLHF
        //////////////////////////////////////////
                `)
                return;
            };
            
            await outputChannel.send(`${userMention(memberId)}, you're up next. Use /pick to lock in your next draft pick.`);

        } else {
            const user = pendingPicks.find(user => user.name === commandCaller)
            if (user) {
                const pickIdx = user.picks.indexOf(pokemonPick);
                if (pickIdx != -1) {
                    await interaction.editReply(`You have already locked in ${pokemonPick}. It is #${pickIdx + 1} in your queue.`);
                    return;
                }
                if (user.picks.length >= cache.teamSize) {
                    await interaction.editReply(`You have already locked in ${user.picks.length} picks. That is far too many picks. Please /delete some before locking more in.`);
                    return;
                }
                user.lock = pokemonPick;
                await interaction.editReply(`Your pick has been locked in and you have ${user.picks.length} pick(s) locked in. When it's your turn to draft I will automatically submit ${pokemonPick} if it is still available.`);
                return;
            }
            const pickSaver = new UserPicks(interaction.user, pokemonPick);
            addUsertoPendingPicks(pickSaver);
            await interaction.editReply(`Your pick has been locked in. When it's your turn to draft I will automatically submit ${pokemonPick} if it is still available.`);
        }

    }
}
