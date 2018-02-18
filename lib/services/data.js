const request = require('request');
const async   = require('async');
const logger  = require('bole')('data');
const errors  = require('./../errors');

// https://regex101.com/r/FdF8U9/1
const GET_COURSES_REGEX = /var elenco_corsi = (\[{.+}\])/;
const GET_COURSES_ENDPOINT = 'https://logistica.univr.it/aule/Orario/combo_call.php';
const GET_OFFICES_REGEX = /var elenco_sedi = (\[{.+}\])/;
const GET_OFFICES_ENDPOINT = 'https://logistica.univr.it/aule/Orario/combo_call.php';
const POST_TIMETABLE_ENDPOINT = 'https://logistica.univr.it/aule/Orario/grid_call.php';
const POST_ROOMS_ENDPOINT = 'https://logistica.univr.it/aule/Orario/rooms_call.php';

/* Returns a list of courses
 *
 */
const getCourses = (cb) => {
	// The response requires a lot of work before it can be useful
	let options = {
		url: GET_COURSES_ENDPOINT,
		method: 'GET'
	};

	// Get the data
	request(options, (err, result, body) => {
		if (err) {
			cb(err);
			return;
		}

		if (result['statusCode'] != 200) {
			logger.error(`Status ${result['statusCode']}. Unable to connect to ${GET_COURSES_ENDPOINT}, ${body}`);

			cb(new errors.ConnectionError(GET_COURSES_ENDPOINT));
			return;
		}
		
		// Now we want to retrieve a list of academic years (each of this contains courses etc.)
		// This list is inside a variable, time for regex then
		let academicYears = [];
		try {
			let rawAcademicYears = GET_COURSES_REGEX.exec(body);
			academicYears = JSON.parse(rawAcademicYears[1]);
		} catch (e) {
			logger.error(`Unable to parse courses response ${e['message']}`);

			cb(new errors.InternalServerError());
			return;
		}

		if (!academicYears['length']) {
			logger.error('No academic years found. You should have a look');

			cb(new errors.InternalServerError());
			return;
		}

		let courses = [];

		// Suppose first item of the array is the current academic year
		let thisAcademicYear = academicYears[0];
		thisAcademicYear['elenco'].forEach((c) => {
			let course = {
				name: c['label'],
				academicYearId: thisAcademicYear['valore'],
				courseId: c['valore'],
				years: []
			};

			c['elenco_anni'].forEach((courseYear) => {
				course['years'].push({
					name: courseYear['label'],
					yearId: courseYear['valore']
				});
			});

			courses.push(course);
		});

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
	// Javascript's Date uses months from 0-11 but API allows 1-12. Decrease month of 1 unit
	month -= 1;
	let currentDay = new Date(year, month, 1);
	let lessons = [];

	async.until(() => {
		// Returns true until `currentDay` is the last day of this `month`
		return currentDay.getDate() == new Date(year, month, 0).getDate();
	},
	(cb) => {
		// If `currentDay` is not monday, skip to next iteration
		if (currentDay.getDay() != 1) {
			// If you remove this you'll generate an infinite loop
			currentDay.setDate(currentDay.getDate() + 1);

			cb();
			return;
		}

		getWeeklyTimetable(`${currentDay.getDate()}-${currentDay.getMonth() + 1}-${currentDay.getFullYear()}`, academicYearId, courseId, courseYearId, (err, weeklyTimetable) => {
			if (err) {
				cb(err);
				return;
			}

			weeklyTimetable['celle'].forEach((e) => {
				// Finds the number of days between monday and the day of the event
				let offsetFromFirstDayOfWeek = weeklyTimetable['giorni'].find(x => x['valore'] == e['giorno'])['valore'] - 1;

				// Creates start and end date for this event
				// NOTE: please apologize for the incomprehensible piece of code. I had not time to make it better :(
				let startDate = new Date(year, month, currentDay.getDate() + offsetFromFirstDayOfWeek, e['ora_inizio'].split(':')[0], e['ora_inizio'].split(':')[1], 0, 0);
				let endDate = new Date(year, month, currentDay.getDate() + offsetFromFirstDayOfWeek, e['ora_fine'].split(':')[0], e['ora_fine'].split(':')[1], 0, 0);

				lessons.push({
					name: e['titolo_lezione'],
					teacher: e['docente'],
					startTimestamp: startDate.getTime(),
					endTimestamp: endDate.getTime(),
					room: e['aula']
				});
			});

			// If you remove this you'll generate an infinite loop
			currentDay.setDate(currentDay.getDate() + 1);

			cb();
		});
	}, (err) => {
		if (err) {
			cb(err);
			return;
		}

		cb(null, lessons);
	});
};

/* Returns an object with a list of events from a week
 *
 * @param - first day of the week (monday, format is dd-mm-yyyy)
 * @param - academic year id
 * @param - course id
 * @param - course year id
 */
const getWeeklyTimetable = (firstDayOfWeek, academicYearId, courseId, courseYearId, cb) => {
	let options = {
		url: POST_TIMETABLE_ENDPOINT,
		method: 'POST',
		form: {
			'_lang': 'it',
			'aa': '2017',
			'all_events': '0',
			'anno': academicYearId,
			'anno2': courseYearId,
			'cdl': courseId,
			'corso': courseId,
			'date': firstDayOfWeek,
			'form-type': 'corso'
		}
	};

	request(options, (err, result, body) => {
		if (err) {
			cb(err);
			return;
		}

		if (result['statusCode'] != 200) {
			logger.error(`Status ${result['statusCode']}. Unable to connect to ${POST_TIMETABLE_ENDPOINT}, ${body}`);

			cb(new errors.ConnectionError(POST_TIMETABLE_ENDPOINT));
			return;
		}

		try {
			cb(null, JSON.parse(body));
		} catch (e) {
			logger.error(`Unable to parse timetable response ${e['message']}`);

			cb(new errors.InternalServerError());
		}
	});
};

/* Returns a list of offices
 *
 */
const getOffices = (cb) => {
	// The response requires a lot of work before it can be useful
	let options = {
		url: GET_OFFICES_ENDPOINT,
		method: 'GET'
	};

	request(options, (err, result, body) => {
		if (err) {
			cb(err);
			return;
		}

		if (result['statusCode'] != 200) {
			cb(new errors.ConnectionError(GET_OFFICES_ENDPOINT));
			return;
		}
		
		// Now we want to retrieve a list of offices
		// This list is inside a variable, time for regex then
		let offices = [];
		try {
			let rawOffices = GET_OFFICES_REGEX.exec(body);
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
				officeId: o['valore']
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
const getRooms = (officeId, cb) => {
	let todayDate = new Date();
	let today = `${todayDate.getDate()}-${todayDate.getMonth() + 1}-${todayDate.getFullYear()}`;
	let options = {
		url: POST_ROOMS_ENDPOINT,
		method: 'POST',
		form: {
			'_lang': 'it',
			'date': today,
			'sede': officeId,
			'form-type': 'rooms'
		}
	};

	request(options, (err, result, body) => {
		if (err) {
			cb(err);
			return;
		}

		if (result['statusCode'] != 200) {
			cb(new errors.ConnectionError(POST_ROOMS_ENDPOINT));
			return;
		}

		let parsedResponse = { };
		try {
			parsedResponse = JSON.parse(body);
		} catch (e) {
			logger.error(`Unable to parse courses response ${e['message']}`);
			
			cb(new errors.InternalServerError());
			return;
		}

		if (!parsedResponse['events']) {
			cb(new errors.InternalServerError());
			return;
		}

		let rooms = [];
		parsedResponse['events'].forEach((e) => {
			let roomIndex = rooms.findIndex(x => x['name'] == e['NomeAula']);
			if (roomIndex == -1) {
				// Room to add from scratch
				rooms.push({
					name: e['NomeAula'],
					events: [
						{
							name: e['name'],
							startTimestamp: e['timestamp_from'],
							endTimestamp: e['timestamp_to']
						}
					]
				});
			}
			else {
				// Adds event to a room
				rooms[roomIndex]['events'].push({
					name: e['name'],
					startTimestamp: e['timestamp_from'],
					endTimestamp: e['timestamp_to']
				});
			}
		});

		cb(null, rooms);
	});
};

module.exports = {
	getCourses: getCourses,
	getLessons: getLessons,
	getOffices: getOffices,
	getRooms: getRooms
};
