const teachings = {
	// GET /academicyear/{academicYearId}/course/{courseId}/teachings
	getAll: async (ctx) => {
		let academicYearId = ctx['params']['academicYearId'];
		let courseId = ctx['params']['courseId'];

		let courses = await ctx.api.getCourses();
		let course = courses.find((x) => x['id'] == courseId && x['academicYearId'] == academicYearId);
		if (!course) {
			ctx.throw(404);
		}
		
		let result = [];
		for (let i = 0; i < course['years']['length']; i++) {
			let y = course['years'][i];
			
			let teachings = await ctx.api.getTeachings(academicYearId, courseId, y['id']);
			teachings.forEach((teaching) => {
				teaching['yearId'] = y['id'];
				result.push(teaching);
			});
		}

		ctx.body = result;
	}
};

module.exports = teachings;