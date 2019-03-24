const data = require('./../api.js');

const lessons = {
	// GET /academicyear/{academicYearId}/course/{courseId}/year/{courseYearId}/lessons?[year={year}&month={month}]
	get: (req, res, next) => {
		let month = req['query']['month'] || new Date().getMonth() + 1;
		let year = req['query']['year'] || new Date().getFullYear();
		let academicYearId = req['params']['academicYearId'];
		let courseId = req['params']['courseId'];
		let yearId = req['params']['yearId'];

		data.getLessons(month, year, academicYearId, courseId, yearId, (err, lessons) => {
			if (err) {
				next(err);
				return;
			}

			res.sendData(200, lessons);
		});
	}
};

module.exports = lessons;
