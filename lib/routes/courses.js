const data    = require('./../services/data.js');

const courses = {
	// GET /courses
	get: (req, res, next) => {
		data.getCourses((err, result) => {
			if (err) {
				next(err);
				return;
			}

			res.sendData(200, result);
		});
	}
};

module.exports = courses;
