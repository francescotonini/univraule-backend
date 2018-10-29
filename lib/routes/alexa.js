const data    = require('./../services/data.js');
const logger  = require('bole')('data');
const async   = require('async');

const alexa = {
	// POST /alexa
	get: (req, res, next) => {

		logger.info(JSON.stringify(req['body']));

		const officeIds = [1, 2, 3];

		async.waterfall([
			(cb) => {
				async.map(officeIds, (officeId, cb) => {
					data.getRooms(officeId, cb);
				}, (err, arrayOfArrayOfRooms) => {
					if (err) {
						cb && cb(err);
						return;
					}

					// Flatten array, sort alphabetically and exclude rooms with name "ufficio"
					let rooms = [].concat.apply([], arrayOfArrayOfRooms)
						.sort((x, y) => x['name'].localeCompare(y['name']))
						.filter(x => x['name'].toLowerCase().indexOf('ufficio') == -1);
	
					cb(null, rooms);
				});
			},
			(rooms, cb) => {
				let freeRooms = [];
				rooms.forEach((room) => {
					let now = new Date();
					if (now.getDay() == 0) {
						// Today is sunday
						return;
					}

					let currentEvent = room['events'].find(x => x['startTimestamp'] * 1000 <= now.getTime() && now.getTime() <= x['endTimestamp'] * 1000);
					let nextEvent = room['events'].find(x => x['startTimestamp'] * 1000 >= now.getTime());

					if (!currentEvent && nextEvent) {
						freeRooms.push({
							name: room['name'],
							until: nextEvent['startTimestamp']  * 1000
						});
					}
					else if (!currentEvent && !nextEvent) {
						let closingTime = new Date();
						closingTime.setHours(19);
						closingTime.setMinutes(30);

						freeRooms.push({
							name: room['name'],
							until: closingTime.getTime()
						});
					}
				});

				cb(null, freeRooms);
			}
		], (err, rooms) => {
			if (err) {
				throw err;
			}

			let response = {
				version: 'string',
				response: {
					outputSpeech: {
						type: 'PlainText',
						text: `Al momento sono libere ${rooms['length']} aule`
					}
				}
			};

			res.sendData(200, response);
		});
	}
};




module.exports = alexa;