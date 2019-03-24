const moment = require('moment-timezone');
const api    = require('./../api.js');

const getFirstEmptySpace = (events) => {
	let nowTimestamp = moment().unix();
	events = events.filter((x) => x['endTimestamp'] > nowTimestamp);

	for (let i = 0; i < events['length'] - 1; i++) {
		let thisEvent = events[i];
		let nextEvent = events[i + 1];

		let endTimestampThisEvent = moment(thisEvent['endTimestamp'], 'X');
		let startTimestampNextEvent = moment(thisEvent['startTimestamp'], 'X');

		if (endTimestampThisEvent.hour() != startTimestampNextEvent.hour() ||
			endTimestampThisEvent.minute() != startTimestampNextEvent.minute()) {

			return {
				from: thisEvent['endTimestamp'],
				until: nextEvent['startTimestamp']
			};
		}
	}

	let lastEvent = events[events['length'] - 1];
	let timeLastEvent = moment(lastEvent['endTimestamp'], 'X');
	let closingTime = moment.tz('19:30', 'HH:mm', 'Europe/Rome');
	if (timeLastEvent.hour() != closingTime.hour() ||
		timeLastEvent.minute() != closingTime.minute()) {

		return {
			from: lastEvent['endTimestamp'],
			until: closingTime.format('X')
		};
	}

	return;
};

const rooms = {
	// GET /offices/{officeId}/rooms
	get: (req, res, next) => {
		let officeId = req['params']['officeId'];

		api.getRooms(officeId, (err, rooms) => {
			if (err) {
				next(err);
				return;
			}

			rooms.forEach((room) => {
				// Get current status
				let now = moment.tz('Europe/Rome');
				let currentEvent = room['events'].find((x) => x['startTimestamp'] <= now.unix() && now.unix() <= x['endTimestamp']);
				let nextEvent = room['events'].find((x) => x['startTimestamp'] >=  now.unix());
	
				if (!currentEvent && nextEvent) {
					room['isFree'] = true;
					room['until'] = nextEvent['startTimestamp'] * 1000;
				}
				else if (!currentEvent && !nextEvent) {
					let closingTime = moment.tz('19:30', 'HH:mm', 'Europe/Rome');
	
					room['isFree'] = true;
					room['until'] = closingTime.format('x');
				}
				else if (currentEvent) {
					let firstEmptySpace = getFirstEmptySpace(room['events']);
					if (!firstEmptySpace) {
						let closingTime = moment.tz('19:30', 'HH:mm', 'Europe/Rome');
	
						room['isFree'] = false;
						room['until'] = closingTime.format('x');
					}
					else {
						room['isFree'] = false;
						room['until'] = firstEmptySpace['from'] * 1000;
					}
				}
			});

			res.sendData(200, rooms);
		});
	}
};

module.exports = rooms;
