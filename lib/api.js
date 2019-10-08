const phin    = require('phin').unpromisified;
const moment  = require('moment-timezone');
const logger  = require('./logger.js');
const errors  = require('./errors');

// https://regex101.com/r/FdF8U9/1
const GET_OFFICES_REGEX = /var elenco_sedi = (\[{.+}\])/;
const GET_OFFICES_ENDPOINT = 'https://logistica.univr.it/PortaleStudentiUnivr/combo_call.php?sw=rooms_';
const POST_ROOMS_ENDPOINT = 'https://logistica.univr.it/PortaleStudentiUnivr/rooms_call.php';

const PHIN_TIMEOUT = 30 * 1000;

/* Returns an array of offices
 *
 */
const getOffices = (cb) => {
	phin({
		url: GET_OFFICES_ENDPOINT,
		method: 'GET',
		timeout: PHIN_TIMEOUT
	}, (err, response) => {
		if (err) {
			logger.error(`getOffices(): exception on request - ${err['message']}`);

			cb(new errors.InternalServerError());
			return;
		}

		if (response['statusCode'] != 200) {
			logger.error(`getOffices(): invalid response from ${GET_OFFICES_ENDPOINT} (${response['statusCode']}): ${response['body']}`);
	
			cb(new errors.ConnectionError());
			return;
		}
		
		// Now we want to retrieve a list of offices
		// This list is inside a variable, time for regex
		let offices = [];
		try {
			let rawOffices = GET_OFFICES_REGEX.exec(response['body']);
			offices = JSON.parse(rawOffices[1]);
		} catch (e) {
			logger.error(`getOffices(): unable to parse offices response ${e['message']}`);
	
			cb(new errors.InternalServerError());
			return;
		}
	
		if (!offices['length']) {
			logger.error('getOffices(): offices years not found. You should have a look');
	
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
	
		logger.debug(`getOffices(): found ${formattedOffices['length']} offices`);
	
		cb(null, formattedOffices);
	});
};

/* Returns a list of rooms
 *
 * @param day (format dd-mm-yyyy)
 * @param office id
 */
const getRooms = (officeId, cb) => {
	let todayDate = moment.tz('Europe/Rome');
	let today = `${todayDate.date()}-${todayDate.month() + 1}-${todayDate.year()}`;

	phin({
		url: POST_ROOMS_ENDPOINT,
		method: 'POST',
		timeout: PHIN_TIMEOUT,
		form: {
			_lang: 'it',
			date: today,
			sede: officeId,
			'form-type': 'rooms'
		}
	}, (err, response) => {
		if (err) {
			logger.error(`getRooms(): exception on request for officeId ${officeId} - ${err['message']}`);

			cb(new errors.ConnectionError());
			return;
		}

		if (response['statusCode'] != 200) {
			logger.error(`getRooms(): invalid response for officeId ${officeId} from ${POST_ROOMS_ENDPOINT} (${response['statusCode']}): ${response['body']}`);
	
			cb(new errors.ConnectionError());
			return;
		}
	
		let parsedResponse = { };
		try {
			parsedResponse = JSON.parse(response['body']);
		} catch (e) {
			logger.error(`getRooms(): unable to parse response for officeId: ${officeId} ${e['message']}`);
			
			cb(new errors.InternalServerError());
			return;
		}
	
		if (!parsedResponse['events'] || !parsedResponse['order'] || !parsedResponse['area_rooms']) {
			logger.error(`getRooms(): unable to get rooms for officeId ${officeId}, response is invalid`);
	
			cb(new errors.InternalServerError());
			return;
		}
	
		let rooms = [];
		let roomsId = parsedResponse['order'];
		let roomsData = parsedResponse['area_rooms'][officeId];
		roomsId.forEach((roomId) => {
			// Get data from 'area_rooms'
			let roomData = roomsData[roomId];
			if (!roomData) {
				logger.error(`Room data for id ${roomId} on officeId ${officeId} not found`);
				return;
			}
	
			let room = {
				name: roomData['room_name'],
				events: []
			};
	
			let events = parsedResponse['events'].filter((x) => x['room'] == roomData['id']);
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
	
		logger.debug(`getRooms(): found ${rooms['length']} rooms for officeId ${officeId}`);
	
		cb(null, rooms);
	});
};

module.exports = {
	getOffices: getOffices,
	getRooms: getRooms
};
