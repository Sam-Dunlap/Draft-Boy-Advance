const {
	SlashCommandBuilder,
	userMention,
	EmbedBuilder
} = require("discord.js");
const { google } = require("googleapis");
const { spreadsheetId } = require("../config.json");
const {
	pendingPicks,
	UserPicks,
	addUsertoPendingPicks
} = require("../PendingPicks");
const { stagePicks } = require("../ManageQueuedPicks");
const { getCacheWithGuildId, deleteCache } = require("../Cache");
const { getDraftSeat } = require("../SnakeDraftEquations");
const { validatePick } = require("../validatePick");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("pick")
		.setDescription("lock or queue a pick")
		.addStringOption(o =>
			o.setName("pokemon").setDescription("Your Pick").setRequired(true)
		)
		.addBooleanOption(o =>
			o.setName("admin").setDescription("admin pick? default false")
		),
	async execute(interaction) {
		const cache = getCacheWithGuildId(interaction.guild.id);

		if (!cache) {
			return await interaction.reply({
				content: `You do not appear to be in an active draft.`,
				ephemeral: true
			});
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
			ranges: ["BotData!A2:C2", "Master!H2:H", "Master!K2:K"]
		});

		// from BotData!A2:C2
		const n = sheetData.data.valueRanges[0].values[0][0];
		const x = sheetData.data.valueRanges[0].values[0][1];

		// from Master!H2:H, names of legal pokemon
		const allLegalPicks = sheetData.data.valueRanges[1].values.flat();

		// from Master!K2:K
		const sprites = sheetData.data.valueRanges[2].values.flat();

		const outputChannel = await interaction.guild.channels.fetch(
			cache.outputChannel
		);
		const pokemonPick = interaction.options
			.getString("pokemon")
			.toUpperCase();
		const admin = interaction.options.getBoolean("admin");
		const y = getDraftSeat(n, x);

		if (admin && interaction.user.id !== "124319635481821184") {
			return interaction.reply(
				`Hey, ${interaction.user} is trying to make an admin pick and they're not an admin! Shame them!`
			);
		}

		await interaction.reply({
			content: `Making sure ${pokemonPick} is available...`,
			ephemeral: true
		});

		const currentDrafter = cache.pickOrder[y - 1];

		const commandCaller = interaction.user.username;
		const { valid, message, pickedMons } = await validatePick(
			commandCaller,
			pokemonPick,
			cache
		);

		if (valid) {
			if (commandCaller === currentDrafter || admin) {
				const teamRef = await googleSheets.spreadsheets.values.get({
					auth,
					spreadsheetId,
					range: "Teams Reference!A2:E",
					valueRenderOption: "UNFORMATTED_VALUE"
				});
				const teamName = teamRef.data.values.find(
					teamArray => teamArray[0] === currentDrafter
				)[1];

				const values = [[pokemonPick, currentDrafter]];

				await interaction.editReply(
					`Success! You have locked in ${pokemonPick}.`
				);
				const lockMessageEmbed = new EmbedBuilder()
					.setColor(0xd81717)
					.setTitle(
						`${interaction.user.username} has locked in ${
							admin
								? pokemonPick + ` for ${currentDrafter}`
								: pokemonPick
						}!`
					)
					.setThumbnail(sprites[message])
					.setFooter({ text: teamName })
					.setTimestamp();

				await outputChannel.send({ embeds: [lockMessageEmbed] });
				pickedMons.push(pokemonPick);
				const { n1, nextPlayerName, stagedPicks } = stagePicks({
					n,
					x,
					guildId: interaction.guild.id,
					pickedMons
				});

				if (n1 > cache.teamSize * cache.playerCount) {
					deleteCache(cache);
					for (
						let i = 0;
						i < n1 - cache.teamSize * cache.playerCount - 1;
						i++
					) {
						console.log(
							`${new Date().toLocaleTimeString()} - [REMOVED FROM STAGEDPICKS]: `,
							stagedPicks.pop()
						);
					}
				}

				stagedPicks.forEach(pick => {
					values.push(pick);
				});

				stagedPicks.forEach(async pick => {
					const spriteIdx = allLegalPicks.findIndex(
						pokemon =>
							pokemon.toUpperCase() === pick[0].toUpperCase()
					);
					let teamName = teamRef.data.values.find(
						teamArray => teamArray[0] === pick[1]
					)[1];
					const stagedEmbed = new EmbedBuilder()
						.setColor(0xd81717)
						.setTitle(`${pick[1]} has locked in ${pick[0]}!`)
						.setThumbnail(sprites[spriteIdx])
						.setFooter({ text: teamName })
						.setTimestamp();
					await outputChannel.send({ embeds: [stagedEmbed] });
				});
				const queriedMember = await interaction.guild.members
					.fetch({ query: nextPlayerName, limit: 1 })
					.catch(console.error);
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
						values: [[n1]]
					}
				});

				if (n1 > cache.teamSize * cache.playerCount) {
					deleteCache(cache);
					await outputChannel.send(
						"The draft is complete. May the best mons win!"
					);
					console.log(
						`${new Date().toLocaleTimeString()} - 
          //////////////////////////////////////////
          Draft Finished
          ${n} picks, I think.
          GLHF
          //////////////////////////////////////////
                  `
					);
					return;
				}

				return await outputChannel.send(
					`${userMention(
						memberId
					)}, you're up next. Use /pick to lock in your next draft pick.`
				);
			} else {
				const user = pendingPicks.find(
					user => user.name === commandCaller
				);
				if (user) {
					const pickIdx = user.picks.indexOf(pokemonPick);
					if (pickIdx != -1) {
						return await interaction.editReply(
							`You have already locked in ${pokemonPick}. It is #${
								pickIdx + 1
							} in your queue.`
						);
					}
					if (user.picks.length >= cache.teamSize) {
						return await interaction.editReply(
							`You have already locked in ${user.picks.length} picks. To add more would be egregiously hedonistic. Please /delete some before locking more in.`
						);
					}
					user.lock = pokemonPick;
					return await interaction.editReply(
						`Your pick has been locked in and you have ${user.picks.length} pick(s) locked in. When it's your turn to draft I will automatically submit ${pokemonPick} if it is still available.`
					);
				}
				const pickSaver = new UserPicks(interaction.user, pokemonPick);
				addUsertoPendingPicks(pickSaver);
				return await interaction.editReply(
					`Your pick has been locked in. When it's your turn to draft I will automatically submit ${pokemonPick} if it is still available.`
				);
			}
		} else {
			return await interaction.editReply(message);
		}
	}
};
