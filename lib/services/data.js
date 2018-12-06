const phin    = require('phin');
const logger  = require('bole')('data');
const errors  = require('./../errors');

// https://regex101.com/r/FdF8U9/1
const GET_OFFICES_REGEX = /var elenco_sedi = (\[{.+}\])/;
const GET_OFFICES_ENDPOINT = 'https://logistica.univr.it/aule/Orario/combo_call.php';
const POST_ROOMS_ENDPOINT = 'https://logistica.univr.it/aule/Orario/rooms_call.php';

// Little extension for UniTN Aule 
const POST_ROOMS_UNITN_ENDPOINT = 'https://easyroom.unitn.it/Orario/rooms_call.php';

/* Returns a list of offices
 *
 */
const getOffices = (cb) => {
	// The response requires a lot of work before it can be useful
	let options = {
		url: GET_OFFICES_ENDPOINT,
		method: 'GET',
		timeout: 30 * 1000
	};

	phin(options, (err, res) => {
		if (err) {
			logger.error(`Connection error to ${options['url']} -> ${err}`);

			cb(new errors.ConnectionError(options['url']));
			return;
		}

		if (res['statusCode'] != 200) {
			cb(new errors.ConnectionError(GET_OFFICES_ENDPOINT));
			return;
		}
		
		// Now we want to retrieve a list of offices
		// This list is inside a variable, time for regex then
		let offices = [];
		try {
			let rawOffices = GET_OFFICES_REGEX.exec(res.body);
			offices = JSON.parse(rawOffices[1]);
		} catch (e) {
			logger.error(`Unable to parse offices response ${e['message']}`);

			cb(new errors.InternalServerError());
			return;
		}

		if (!offices['length']) {
			logger.error('No offices years found. You should have a look');

			cb(new errors.InternalServerError());
			return;
		}

		let formattedOffices = [];
		offices.forEach((o) => {
			let office = {
				name: o['label'],
				id: o['valore']
			};

			formattedOffices.push(office);
		});

		cb(null, formattedOffices);
	});
};

/* Returns a list of rooms
 *
 * @param day (format dd-mm-yyyy)
 * @param office id
 */
const getRooms = (officeId, place, cb) => {
	let todayDate = new Date();
	let today = `${todayDate.getDate()}-${todayDate.getMonth() + 1}-${todayDate.getFullYear()}`;
	let options = {
		url: place == 'vr' ? POST_ROOMS_UNIVR_ENDPOINT : POST_ROOMS_UNITN_ENDPOINT,
		method: 'POST',
		timeout: 30 * 1000,
		form: {
			'_lang': 'it',
			'date': today,
			'sede': officeId,
			'form-type': 'rooms'
		}
	};

	phin(options, (err, res) => {
		if (err) {
			logger.error(`Connection error to ${options['url']} -> ${err}`);

			cb(new errors.ConnectionError(options['url']));
			return;
		}
		if (res['statusCode'] != 200) {
			cb(new errors.ConnectionError(POST_ROOMS_ENDPOINT));
			return;
		}

		let parsedResponse = { };
		try {
			parsedResponse = JSON.parse(res.body);
		} catch (e) {
			logger.error(`Unable to parse courses response ${e['message']}`);
			
			cb(new errors.InternalServerError());
			return;
		}

		if (!parsedResponse['events'] ||
			!parsedResponse['order'] ||
			!parsedResponse['area_rooms']) {
			cb(new errors.InternalServerError());
			return;
		}

		let rooms = [];
		let roomsId = parsedResponse['order'];
		let roomsData = parsedResponse['area_rooms'][officeId];

		logger.debug(`Found ${roomsId['length']} rooms`);
		roomsId.forEach((roomId) => {
			// Get data from 'area_rooms'
			let roomData = roomsData[roomId];
			if (!roomData) {
				logger.error(`Room data for id ${roomId} not found`);
				return;
			}

			let room = {
				name: roomData['room_name'],
				events: []
			};

			let events = parsedResponse['events'].filter(x => x['room'] == roomData['id']);
			if (events) {
				events.forEach((e) => {
					room['events'].push({
						name: e['name'],
						startTimestamp: e['timestamp_from'],
						endTimestamp: e['timestamp_to']
					});
				});
			}

			rooms.push(room);
		});

		cb(null, rooms);
	});
};

module.exports = {
	getOffices: getOffices,
	getRooms: getRooms
};
