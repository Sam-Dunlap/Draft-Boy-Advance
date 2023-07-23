const { google } = require("googleapis");
const { spreadsheetId } = require("./config.json");
const { validateTier } = require("./validateTier");
const { spellCheck } = require("./spellCheck");

module.exports = {
	// always returns {valid: boolean, message: {content: string}}.
	// whether caller == drafter & sending the lock-in message to output channel
	// is handled in pick.js
	async validatePick(user, pick, cache) {
		const auth = new google.auth.GoogleAuth({
			keyFile: "./credentials.json",
			scopes: "https://www.googleapis.com/auth/spreadsheets"
		});
		const gclient = await auth.getClient();
		const googleSheets = google.sheets({ version: "v4", auth: gclient });

		const sheetData = await googleSheets.spreadsheets.values.batchGet({
			auth,
			spreadsheetId,
			ranges: ["Master!A2:A", "Master!B2:C", "Master!I2:J"]
		});

		// from Master!A2:A, the array of all pokemon picked so far
		const pickedData = sheetData.data.valueRanges[0].values;

		// if there are no picks yet, pickData is undefined and .flat() will throw
		// an error. Otherwise we need to flatten because pickedData is formatted like
		// [ [pokemon1] , [pokemon2] , [etc] ]
		const pickedMons = pickedData ? pickedData.flat() : [];
		console.log(pickedMons);
		var foundDuplicatePick = false;
		pickedMons.forEach(mon => {
			if (mon.toUpperCase() === pick) {
				foundDuplicatePick = true;
			}
		});

		if (foundDuplicatePick) {
			return {
				valid: false,
				message: {
					content: `${pick} has already been chosen in this draft.\nPlease lock in a different Pokemon.`
				},
				pickedMons
			};
		}

		// from Master!B2:C, formatted as [ [coach1, tier] , [coach2, tier] ].
		// = undefined if there are no picks yet, so fallback to an empty array
		// this is used to verify that the pick is from a legal tier
		const coachAndTierArray = sheetData.data.valueRanges[1].values || [];
		console.log(coachAndTierArray);
		// from Master!H2:I. formatted as [ [pokemon, tier] , [pokemon2, tier] ]
		const picksWithTiers = sheetData.data.valueRanges[2].values;

		// this will always be the same length as was set in /start, but filled with 0
		// more/fewer tiers in future drafts won't break this
		// also doesn't break if tiers aren't set because tiers default to 99/99/99/99
		const tiers = Array.from(cache.tiers).fill(0);
		for (let i = 0; i < coachAndTierArray.length; i++) {
			// won't break if tiers aren't set in the sheet for some reason
			if (coachAndTierArray[i].length === 1) return;
			if (coachAndTierArray[i][0] === user) {
				tiers[Number(coachAndTierArray[i][1]) - 1] += 1;
			}
		}

		// 0th index from each array in Master!H2:I gets every legal pokemon name
		const validPicks = [];
		picksWithTiers.forEach(pick => {
			validPicks.push(pick[0].toUpperCase());
		});

		if (!validPicks.find(mon => mon.toUpperCase() === pick)) {
			const suggestedPick = spellCheck(pick, validPicks);
			return {
				valid: false,
				message: {
					content: `I couldn't find ${pick}. Did you mean ${suggestedPick}?`
				},
				pickedMons
			};
		}

		// tier checker
		const tieredPick = picksWithTiers.find(
			tPick => tPick[0].toUpperCase() === pick
		);
		const validTier = validateTier(tiers, tieredPick, cache);
		if (!validTier) {
			return {
				valid: false,
				message: {
					content: `${pick} is a tier ${tieredPick[1]} Pokemon, and you do not have any tier ${tieredPick[1]} picks left to use.\nPick another Pokemon.`
				},
				pickedMons
			};
		}

		// we've passed every validation check! hooray! the pokemon is valid and it's time to lock it in.
		pickedMons.push(pick);
		return {
			valid: true,
			message: validPicks.indexOf(pick),
			pickedMons
		};
	}
};
