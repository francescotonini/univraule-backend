const data    = require('./../services/data.js');

const teachings = {
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
