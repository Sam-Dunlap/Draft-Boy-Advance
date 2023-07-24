const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { google } = require("googleapis");
const { spreadsheetId } = require("../config.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("waiver")
		.setDescription(
			"Switch a Pokemon on your squad with a Pokemon in the pool"
		)
		.addUserOption(option =>
			option
				.setName("coach")
				.setDescription("The coach requesting the swap")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("from")
				.setDescription("The Pokemon on the squad")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("to")
				.setDescription("The Pokemon in the pool")
				.setRequired(true)
		)
		.setDefaultMemberPermissions("0"),
	async execute(interaction) {
		const from = interaction.options.getString("from");
		const to = interaction.options.getString("to");
		const requestingCoach = interaction.options.getUser("coach").username;

		await interaction.reply({
			content: `Verifying waiver request... :hourglass_flowing_sand:`,
			ephemeral: true
		});

		const auth = new google.auth.GoogleAuth({
			keyFile: "./credentials.json",
			scopes: "https://www.googleapis.com/auth/spreadsheets"
		});
		const gclient = await auth.getClient();
		const googleSheets = google.sheets({ version: "v4", auth: gclient });

		const sheetData = await googleSheets.spreadsheets.values.batchGet({
			auth,
			spreadsheetId,
			ranges: ["Master!A2:C", "Master!I2:J", "BotData!C2", "Master!L2:L"]
		});

		// from Master!A2:C, formatted [[pokemon, coach, tier], [pokemon2, coach2, tier]]
		const pickedMonsWithCoachAndTier = sheetData.data.valueRanges[0].values;

		// from I2:J, formatted [[pokemon, tier], [pokemon2, tier]]
		const poolMonsWithTier = sheetData.data.valueRanges[1].values;

		// from BotData!C2
		const channelId = sheetData.data.valueRanges[2].values.flat()[0];
		const outputChannel = await interaction.guild.channels.fetch(channelId);

		// from Master!L2:L
		const sprites = sheetData.data.valueRanges[3].values.flat();

		const monsWithSprites = [];
		for (let i = 0; i < poolMonsWithTier.length; i++) {
			monsWithSprites.push({
				pokemon: poolMonsWithTier[i][0],
				sprite: sprites[i]
			});
		}
		// first check that the player owns the from pokemon
		const ownedByCoach = [];
		for (let i = 0; i < pickedMonsWithCoachAndTier.length; i++) {
			if (pickedMonsWithCoachAndTier[i][1] === requestingCoach) {
				ownedByCoach.push(pickedMonsWithCoachAndTier[i]);
			}
		}

		// [pokemon, coach, tier] || undefined
		const verifiedFrom = ownedByCoach.find(
			pokemonArray => pokemonArray[0] === from.toUpperCase()
		);

		if (!verifiedFrom) {
			return await interaction.editReply(
				`It doesn't seem like ${requestingCoach} owns ${from}. Check your spelling or ping mfsgiant if you think this is an error.`
			);
		}

		// then check that the to pokemon is in the pool

		// [pokemon, tier] || undefined
		let verifiedTo;
		poolMonsWithTier.forEach(pokemonArray => {
			if (pokemonArray[0].toUpperCase() === to.toUpperCase()) {
				verifiedTo = pokemonArray;
			}
		});

		if (!verifiedTo) {
			return await interaction.editReply(
				`It doesn't seem like ${to} is in the waiver pool. Check your spelling or ping mfsgiant if you think this is an error.`
			);
		}

		let available = true;
		pickedMonsWithCoachAndTier.forEach(async pokemonArray => {
			if (pokemonArray[0].toUpperCase() === to.toUpperCase()) {
				available = false;
			}
		});

		if (!available)
			return await interaction.editReply(
				`${to} is already on a team and cannot be waivered for.`
			);

		await interaction.editReply(
			`Success! ${requestingCoach}'s ${from} has been waivered for ${to}.`
		);

		pickedMonsWithCoachAndTier.splice(
			pickedMonsWithCoachAndTier.indexOf(verifiedFrom),
			1,
			[verifiedTo[0].toUpperCase(), requestingCoach, verifiedTo[1]]
		);

		const updatePokemon = [];
		pickedMonsWithCoachAndTier.forEach(entry => {
			updatePokemon.push([entry[0]]);
		});

		googleSheets.spreadsheets.values.update({
			auth,
			spreadsheetId,
			range: "Master!A2:A",
			valueInputOption: "RAW",
			resource: {
				values: updatePokemon
			}
		});

		const waiverEmbed = new EmbedBuilder()
			.setColor(0x34a8eb)
			.setTitle(":bangbang: WAIVER WIRE :bangbang:")
			.setImage(
				monsWithSprites.find(
					entry => entry.pokemon.toUpperCase() === to.toUpperCase()
				).sprite
			)
			.setThumbnail(
				monsWithSprites.find(
					entry => entry.pokemon.toUpperCase() === from.toUpperCase()
				).sprite
			)
			.setDescription(`${requestingCoach} has submitted a waiver.`)
			.addFields(
				{ name: "Waived", value: from, inline: true },
				{ name: "For", value: to, inline: true }
			);
		return await outputChannel.send({ embeds: [waiverEmbed] });
	}
};
