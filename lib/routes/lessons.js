const lessons = {
	// GET /academicyear/{academicYearId}/course/{courseId}/year/{courseYearId}/lessons?[year={year}&month={month}]
	get: async (ctx) => {
		let month = ctx['query']['month'] || new Date().getMonth() + 1;
		let year = ctx['query']['year'] || new Date().getFullYear();
		let academicYearId = ctx['params']['academicYearId'];
		let courseId = ctx['params']['courseId'];
		let yearId = ctx['params']['yearId'];

		ctx.body = await ctx.api.getLessons(month, year, academicYearId, courseId, yearId);
	}
};

module.exports = lessons;
