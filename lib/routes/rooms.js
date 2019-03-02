const rooms = {
	// GET /offices/{officeId}/rooms
	get: async (ctx) => {
		let officeId = ctx['params']['officeId'];

		ctx.body = await ctx.api.getRooms(officeId);
	}
};

module.exports = rooms;
