const data    = require('./../services/data.js');

const offices = {
	// GET /offices
	get: (req, res, next) => {
		data.getOffices((err, result) => {
			if (err) {
				next(err);
				return;
			}

			res.sendData(200, result);
		});
	}
};

module.exports = offices;
