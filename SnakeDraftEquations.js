module.exports = {
	// n is a counter that increments whenever a pick is written to spreadsheet. initializes at 1
	// x is the number of seats in the draft
	// this is for snake draft
	getSlope(n, x) {
		if (n % x === 0) return 0;
		if (n % (2 * x) < x) return 1;
		return -1;
	},

	getReverseSlope(n, x) {
		if (n % x === 1) return 0;
		if (n % x === 0 || n % (2 * x) < x) return -1;
		return 1;
	},

	// can GET RID OF y in storage. just calc it every time
	getDraftSeat(n, x) {
		let y = 1;
		// TODO: add cases for other draft types
		for (let i = 1; i < n; i++) {
			if (i % x === 0) continue;
			if (i % (2 * x) <= x) {
				y += 1;
				continue;
			}
			y -= 1;
		}
		return y;
	}
};
