const data    = require('./../services/data.js');

const lessons = {
	// GET /academicyear/{academicYearId}/course/{courseId}/year/{courseYearId}/lessons?[year={year}&month={month}]
	get: (req, res, next) => {
		// Month goes from 1 to 12
		let month = req['query']['month'] || new Date().getMonth() + 1;
		let year = req['query']['year'] || new Date().getFullYear();
		let academicYearId = req['params']['academicYearId'];
		let courseId = req['params']['courseId'];
		let yearId = req['params']['yearId'];

		data.getLessons(month, year, academicYearId, courseId, yearId, (err, result) => {
			if (err) {
				next(err);
				return;
			}

			res.sendData(200, result);
		});
	}
};

module.exports = lessons;
