const courses = {
	// GET /courses
	get: async (ctx) => {
		ctx.body = await ctx.api.getCourses();
	}
};

module.exports = courses;
