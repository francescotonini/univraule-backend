const data    = require('./../data.js');

const rooms = {
	// GET /offices/{officeId}/rooms
	get: (req, res, next) => {
		let officeId = req['params']['officeId'];

		data.getRooms(officeId, (err, result) => {
			if (err) {
				next(err);
				return;
			}

			res.sendData(200, result);
		});
	}
};

module.exports = rooms;
