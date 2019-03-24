const data = require('./../api.js');

const courses = {
	// GET /courses
	get: (req, res, next) => {
		data.getCourses((err, courses) => {
			if (err) {
				next(err);
				return;
			}

			res.sendData(200, courses);
		});
	}
};

module.exports = courses;
