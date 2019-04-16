const phin    = require('phin').unpromisified;
const moment  = require('moment-timezone');
const logger  = require('./logger.js');
const async   = require('async');
const errors  = require('./errors');

// https://regex101.com/r/FdF8U9/1
const GET_COURSES_REGEX = /var elenco_corsi = (\[{.+}\])/;
const GET_COURSES_ENDPOINT = 'https://logistica.univr.it/aule/Orario/combo_call.php';
const GET_OFFICES_REGEX = /var elenco_sedi = (\[{.+}\])/;
const GET_OFFICES_ENDPOINT = 'https://logistica.univr.it/aule/Orario/combo_call.php';
const POST_TIMETABLE_ENDPOINT = 'https://logistica.univr.it/aule/Orario/grid_call.php';
const POST_ROOMS_ENDPOINT = 'https://logistica.univr.it/aule/Orario/rooms_call.php';
const POST_TEACHINGS_ENDPOINT = 'https://logistica.univr.it/aule/Orario/grid_call.php';

const PHIN_TIMEOUT = 30 * 1000;

/* Returns a list of courses
 *
 */
const getCourses = (cb) => {
	phin({
		url: GET_COURSES_ENDPOINT,
		method: 'GET',
		timeout: PHIN_TIMEOUT
	}, (err, response) => {
		if (err) {
			logger.error(`getCourses(): exception on request - ${err['message']}`);
			
			cb(new errors.ConnectionError());
			return;
		}

		let academicYears = [];
		try {
			academicYears = JSON.parse(GET_COURSES_REGEX.exec(response['body'])[1]);
		} catch (e) {
			logger.error(`getCourses(): unable to parse response ${e['message']}`);
	
			cb(new errors.InternalServerError);
			return;
		}
	
		if (!academicYears['length']) {
			logger.error('getCourses(): no academic years found. You should have a look');
	
			cb(new errors.InternalServerError());
			return;
		}
	
		// First item is the current academic year
		let thisAcademicYear = academicYears[0];
		let courses = [];
		thisAcademicYear['elenco'].forEach((c) => {
			let course = {
				name: c['label'],
				academicYearId: thisAcademicYear['valore'],
				id: c['valore'],
				years: []
			};
	
			c['elenco_anni'].forEach((courseYear) => {
				course['years'].push({
					name: courseYear['label'],
					id: courseYear['valore']
				});
			});
	
			courses.push(course);
		});
	
		logger.debug(`getCourses(): found ${courses['length']} courses`);

		cb(null, courses);
	});
};

/* Returns a list of lessons for the current course
 *
 * @param - month (1-12)
 * @param - year
 * @param - academic year id
 * @param - course id
 * @param - course year id
 */
const getLessons = (month, year, academicYearId, courseId, courseYearId, cb) => {
	let lessons = [];
	let lastDayOfMonth = moment.tz(`${month} ${year}`, 'MM YYYY', 'Europe/Rome').endOf('month');
	let currentDay = moment.tz(`${month} ${year}`, 'MM YYYY', 'Europe/Rome').startOf('month');

	// Loop through all days of the month
	async.until(() => {
		return currentDay.date() == lastDayOfMonth.date();
	}, (cb) => {
		// If `currentDay` is not monday, skip to next iteration
		if (currentDay.day() != 1) {
			// If you remove this you'll generate an infinite loop
			currentDay.add(1, 'day');

			cb();
			return;
		}

		getWeeklyTimetable(`${currentDay.date()}-${currentDay.month() + 1}-${currentDay.year()}`, academicYearId, courseId, courseYearId, (err, timetable) => {
			if (err) {
				cb(err);
				return;
			}

			if (timetable['celle']) {
				timetable['celle'].forEach((e) => {
					if (!e['codice_insegnamento']) {
						return;
					}
					
					// Finds the number of days between monday and the day of the event
					let offsetFromFirstDayOfWeek = timetable['giorni'].find((x) => x['valore'] == e['giorno'])['valore'] - 1;
		
					// Creates start and end date for this event
					let today = moment.tz(currentDay, 'Europe/Rome').add(offsetFromFirstDayOfWeek, 'day');
					let startDateRaw = `${year}-${today.month() + 1}-${today.date()} ${e['ora_inizio'].split(':')[0]}:${e['ora_inizio'].split(':')[1]}`;
					let endDateRaw = `${year}-${today.month() + 1}-${today.date()} ${e['ora_fine'].split(':')[0]}:${e['ora_fine'].split(':')[1]}`;

					let startDate = moment.tz(startDateRaw, 'YYYY-M-D H:m', 'Europe/Rome');
					let endDate = moment.tz(endDateRaw, 'YYYY-M-D H:m', 'Europe/Rome');
					
					lessons.push({
						id: e['codice_insegnamento'],
						name: e['titolo_lezione'],
						teacher: e['docente'],
						startTimestamp: startDate.format('x'),
						endTimestamp: endDate.format('x'),
						room: e['aula']
					});
				});
			}

			// If you remove this you'll generate an infinite loop
			currentDay.add(1, 'day');

			cb();
		});
	}, (err) => {
		if (err) {
			cb(err);
			return;
		}

		logger.info(`getLessons(): found ${lessons['length']} lessons for academicYearId ${academicYearId}, courseId ${courseId}, courseYearId ${courseYearId}`);
		cb(null, lessons);
	});
};

/* Returns an array with a list of events from a week
 *
 * @param - first day of the week (monday, format is dd-mm-yyyy)
 * @param - academic year id
 * @param - course id
 * @param - course year id
 */
const getWeeklyTimetable = (firstDayOfWeek, academicYearId, courseId, courseYearId, cb) => {
	phin({
		url: POST_TIMETABLE_ENDPOINT,
		method: 'POST',
		timeout: PHIN_TIMEOUT,
		form: {
			_lang: 'it',
			all_events: '0',
			anno: academicYearId,
			anno2: courseYearId,
			corso: courseId,
			date: firstDayOfWeek,
			'form-type': 'corso'
		}
	}, (err, response) => {
		if (err) {
			logger.error(`getWeeklyTimetable(): exception on request for firstDayOfWeek ${firstDayOfWeek}, academicYearId ${academicYearId}, courseId ${courseId}, courseYearId ${courseYearId} - ${err['message']}`);
			
			cb(new errors.ConnectionError());
			return;
		}

		if (response['statusCode'] != 200) {
			logger.error(`getWeeklyTimetable(): invalid response for firstDayOfWeek ${firstDayOfWeek}, academicYearId ${academicYearId}, courseId ${courseId}, courseYearId ${courseYearId} from ${POST_TIMETABLE_ENDPOINT} (${response['statusCode']}): ${response['body']}`);
	
			cb(new errors.ConnectionError());
			return;
		}
	
		try {
			cb(null, JSON.parse(response['body']));
		} catch (e) {
			logger.error(`getWeeklyTimetable(): unable to parse timetable for firstDayOfWeek ${firstDayOfWeek}, academicYearId ${academicYearId}, courseId ${courseId}, courseYearId ${courseYearId}: ${e['message']}`);
	
			cb(new errors.InternalServerError());
		}
	});
};

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
			logger.error(`getOffices(): invalid response from ${POST_TIMETABLE_ENDPOINT} (${response['statusCode']}): ${response['body']}`);
	
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
			logger.error(`getRooms(): invalid response for officeId ${officeId} from ${POST_TIMETABLE_ENDPOINT} (${response['statusCode']}): ${response['body']}`);
	
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

/* Returns a list of teachings
 *
 * @param - academic year id
 * @param - course id
 * @param - course year id
 */
const getTeachings = (academicYearId, courseId, courseYearId, cb) => {
	phin({
		url: POST_TEACHINGS_ENDPOINT,
		method: 'POST',
		timeout: PHIN_TIMEOUT,
		form: {
			_lang: 'it',
			all_events: '0',
			anno: academicYearId,
			anno2: courseYearId,
			corso: courseId,
			'form-type': 'corso'
		}
	}, (err, response) => {
		if (err) {
			logger.error(`getTeachings(): exception on request - ${err['message']}`);

			cb(new errors.ConnectionError());
			return;
		}

		try {
			let parsedBody = JSON.parse(response['body']);
			let teachings = [];
	
			parsedBody['legenda'].forEach((t) => {
				if (teachings.find((teaching) => teaching['id'] == t['codice'])) {
					return;
				}
				
				teachings.push({
					id: t['codice'],
					name: t['nome']
				});
			});
	
			cb(null, teachings);
		} catch (e) {
			logger.error(`getTeachings(): unable to parse response: ${e['message']}`);
			
			cb(new errors.InternalServerError());
		}
	});
};

module.exports = {
	getCourses: getCourses,
	getLessons: getLessons,
	getOffices: getOffices,
	getRooms: getRooms,
	getTeachings: getTeachings
};
