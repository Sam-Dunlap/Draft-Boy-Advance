const pendingPicks = [];

module.exports = {
	pendingPicks,

	addUsertoPendingPicks: user => {
		pendingPicks.push(user);
		return pendingPicks;
	},

	getUser: username => {
		const user = pendingPicks.find(user => user.name === username);
		return user;
	},

	UserPicks: class {
		lockedPicks = [];
		constructor(user, lockedPick) {
			this.user = user;
			this.lockedPicks.push(lockedPick);
		}

		deletePickByName(name) {
			let deleteIdx = this.lockedPicks.indexOf(name);
			if (deleteIdx !== -1) {
				this.lockedPicks.splice(deleteIdx, 1);
				return true;
			}
			return false;
		}

		deletePickByIndex(idx) {
			this.lockedPicks.splice(idx, 1);
		}

		deleteAllPicks() {
			return this.lockedPicks.splice(0, this.lockedPicks.length);
		}

		get name() {
			return this.user.username;
		}

		get id() {
			return this.user.id;
		}

		get picks() {
			return this.lockedPicks;
		}

		set lock(pick) {
			this.lockedPicks.push(pick);
		}
	}
};
