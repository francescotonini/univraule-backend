const async  = require('async');
const errors = require('./../errors');
const api    = require('./../api.js');

const teachings = {
	// GET /academicyear/{academicYearId}/course/{courseId}/teachings
	getAll: (req, res, next) => {
		let academicYearId = req['params']['academicYearId'];
		let courseId = req['params']['courseId'];

		api.getCourses((err, courses) => {
			if (err) {
				next(err);
				return;
			}

			let course = courses.find((x) => x['id'] == courseId && x['academicYearId'] == academicYearId);
			if (!course) {
				next(new errors.NotFoundError());
				return;
			}

			async.eachSeries(course['years'], (year, cb) => {
				api.getTeachings(academicYearId, courseId, year['id'], (err, teachings) => {
					if (err) {
						cb(err);
						return;
					}

					teachings.forEach((teaching) => {
						teaching['yearId'] = year['id'];
					});

					cb(null, teachings);
				});
			}, (err, teachings) => {
				if (err) {
					next(err);
					return;
				}

				res.sendData(200, [].concat(teachings));
			});
		});
	}
};

module.exports = teachings;
