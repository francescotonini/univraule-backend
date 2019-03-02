const offices = {
	// GET /offices
	get: async (ctx) => {
		ctx.body = await ctx.api.getOffices();
	}
};

module.exports = offices;
