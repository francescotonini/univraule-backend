const async   = require('async');
const error   = require('./../errors/');
const data    = require('./../services/data.js');

const teachings = {
	// GET /academicyear/{academicYearId}/course/{courseId}/teachings
	getAll: (req, res, next) => {
		let academicYearId = req['params']['academicYearId'];
		let courseId = req['params']['courseId'];

		data.getCourses((err, courses) => {
			if (err) {
				next(err);
				return;
			}

			let course = courses.find(x => x['courseId'] == courseId &&
				x['academicYearId'] == academicYearId);
			if (!course) {
				next(new Error("Missing course"));
				return;
			}

			let teachings = [];
			let years = course['years'];
			async.eachSeries(years, (year, cb) => {
				data.getTeachings(academicYearId, courseId, year['id'], (err, result) => {
					if (err) {
						cb(err);
						return;
					}

					teachings.push({
						name: year['name'],
						id: year['id'],
						teachings: result
					});

					cb();
				});
			}, (err) => {
				if (err) {
					next(err);
					return;
				}

				res.sendData(200, teachings);
			});
		});
	},

	// GET /academicyear/{academicYearId}/course/{courseId}/year/{yearId}/teachings
	get: (req, res, next) => {
		let academicYearId = req['params']['academicYearId'];
		let yearId = req['params']['yearId'];
		let courseId = req['params']['courseId'];

		data.getTeachings(academicYearId, courseId, yearId, (err, result) => {
			if (err) {
				next(err);
				return;
			}

			res.sendData(200, result);
		});
	}
};

module.exports = teachings;
