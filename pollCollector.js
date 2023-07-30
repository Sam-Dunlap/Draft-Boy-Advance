const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder
} = require("@discordjs/builders");
const { ButtonStyle } = require("discord.js");

const activePolls = [];

module.exports = {
	name: "pollCollector",
	async buttonPressed(interaction) {
		const eventOriginMessage = interaction.message;
		const poll = this.findPoll(eventOriginMessage.id);
		if (!poll) {
			return interaction.reply({
				content: `I couldn't find the poll you're trying to vote on. If you think this was an error, ping mFsGiant.`,
				ephemeral: true
			});
		}

		if (!poll.multi) {
			if (poll.voters.find(v => v === interaction.user.id)) {
				return interaction.reply({
					content: `You cannot vote multiple times in this poll.`,
					ephemeral: true
				});
			}
			poll.voters.push(interaction.user.id);
		}

		if (interaction.customId === "option1") {
			poll.option1.votes += 1;
		} else {
			poll.option2.votes += 1;
		}

		if (!poll.hidden) {
			eventOriginMessage.edit(poll.buildPoll());
		}
		return interaction.reply({
			content: `Your vote on ${poll.title} has been recorded.`,
			ephemeral: true
		});
	},
	Poll: class Poll {
		constructor(props) {
			this.title = props.title;
			this.message = props.message;
			this.voters = props.voters;
			this.option1 = props.option1;
			this.option2 = props.option2;
			this.hidden = props.hidden;
			this.multi = props.multi;
		}

		buildPoll(closed = false) {
			const embeds = [];
			const embed = new EmbedBuilder()
				.setTitle(`${this.title}`)
				.setColor(0x9c1c80)
				.addFields({
					name: "--------",
					value: `${closed ? "closed" : "open"}`
				});
			embeds.push(embed);
			if (!this.hidden) {
				const resultsEmbed = new EmbedBuilder()
					.setTitle(`${this.option1.votes} | ${this.option2.votes}`)
					.setColor(0x23b5b8);
				embeds.push(resultsEmbed);
			}
			const votingRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("option1")
					.setLabel(this.option1.name)
					.setStyle(ButtonStyle.Success)
					.setDisabled(closed ? true : false),
				new ButtonBuilder()
					.setCustomId("option2")
					.setLabel(this.option2.name)
					.setStyle(ButtonStyle.Danger)
					.setDisabled(closed ? true : false)
			);
			return { embeds, components: [votingRow], content: "" };
		}
	},
	startPoll(poll) {
		activePolls.push(poll);
	},
	returnPolls() {
		return activePolls;
	},

	findPoll(id) {
		return activePolls.find(p => p.message.id === id);
	}
};
