const phin    = require('phin');
const moment  = require('moment');
const pino    = require('pino')();

// https://regex101.com/r/FdF8U9/1
const GET_COURSES_REGEX = /var elenco_corsi = (\[{.+}\])/;
const GET_COURSES_ENDPOINT = 'https://logistica.univr.it/aule/Orario/combo_call.php';
const GET_OFFICES_REGEX = /var elenco_sedi = (\[{.+}\])/;
const GET_OFFICES_ENDPOINT = 'https://logistica.univr.it/aule/Orario/combo_call.php';
const POST_TIMETABLE_ENDPOINT = 'https://logistica.univr.it/aule/Orario/grid_call.php';
const POST_ROOMS_ENDPOINT = 'https://logistica.univr.it/aule/Orario/rooms_call.php';

const PHIN_TIMEOUT = 30 * 1000;

/* Returns a list of courses
 *
 */
const getCourses = async () => {
	let response = await phin({
		url: GET_COURSES_ENDPOINT,
		method: 'GET',
		timeout: PHIN_TIMEOUT
	});

	let academicYears = [];
	try {
		academicYears = JSON.parse(GET_COURSES_REGEX.exec(response['body'])[1]);
	} catch (e) {
		pino.error(`Unable to parse response ${e['message']}`);

		return [];
	}

	if (!academicYears['length']) {
		pino.error('No academic years found. You should have a look');

		return [];
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

	return courses;
};

/* Returns a list of lessons for the current course
 *
 * @param - month (1-12)
 * @param - year
 * @param - academic year id
 * @param - course id
 * @param - course year id
 */
const getLessons = async (month, year, academicYearId, courseId, courseYearId) => {
	// Javascript's Date uses months from 0-11 but API allows 1-12
	let lessons = [];
	let lastDayOfMonth = moment(`${month} ${year}`, 'MM YYYY').endOf('month');
	let currentDay = moment(`${month} ${year}`, 'MM YYYY').startOf('month');

	while (currentDay.date() != lastDayOfMonth.date()) {
		// If `currentDay` is not monday, skip to next iteration
		if (currentDay.day() != 1) {
			// If you remove this you'll generate an infinite loop
			currentDay.add(1, 'day');

			continue;
		}

		let timetable = await getWeeklyTimetable(`${currentDay.date()}-${currentDay.month() + 1}-${currentDay.year()}`, academicYearId, courseId, courseYearId);
		if (timetable['celle']) {
			timetable['celle'].forEach((e) => {
				// Finds the number of days between monday and the day of the event
				let offsetFromFirstDayOfWeek = timetable['giorni'].find((x) => x['valore'] == e['giorno'])['valore'] - 1;
	
				// Creates start and end date for this event
				let startDate = moment(`${year}-${month}-${currentDay.date() + offsetFromFirstDayOfWeek} ${e['ora_inizio'].split(':')[0]}:${e['ora_inizio'].split(':')[1]}`,
					'YYYY-M-D H:m');
				let endDate = moment(`${year}-${month}-${currentDay.date() + offsetFromFirstDayOfWeek} ${e['ora_fine'].split(':')[0]}:${e['ora_fine'].split(':')[1]}`,
					'YYYY-M-D H:m');
				
				lessons.push({
					name: e['titolo_lezione'],
					teacher: e['docente'],
					startTimestamp: startDate.unix() * 1000,
					endTimestamp: endDate.unix() * 1000,
					room: e['aula']
				});
			});
		}

		// If you remove this you'll generate an infinite loop
		currentDay.add(1, 'day');
	}

	return lessons;
};

/* Returns an array with a list of events from a week
 *
 * @param - first day of the week (monday, format is dd-mm-yyyy)
 * @param - academic year id
 * @param - course id
 * @param - course year id
 */
const getWeeklyTimetable = async (firstDayOfWeek, academicYearId, courseId, courseYearId) => {
	let response = await phin({
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
	});

	if (response['statusCode'] != 200) {
		pino.error(`Invalid response from ${POST_TIMETABLE_ENDPOINT} (${response['statusCode']}): ${response['body']}`);

		return [];
	}

	try {
		return JSON.parse(response['body']);
	} catch (e) {
		pino.error(`Unable to parse timetable: ${e['message']}`);

		return [];
	}
};

/* Returns an array of offices
 *
 */
const getOffices = async () => {
	let response = await phin({
		url: GET_OFFICES_ENDPOINT,
		method: 'GET',
		timeout: PHIN_TIMEOUT
	});

	if (response['statusCode'] != 200) {
		pino.error(`Invalid response from ${POST_TIMETABLE_ENDPOINT} (${response['statusCode']}): ${response['body']}`);

		return [];
	}
	
	// Now we want to retrieve a list of offices
	// This list is inside a variable, time for regex
	let offices = [];
	try {
		let rawOffices = GET_OFFICES_REGEX.exec(response['body']);
		offices = JSON.parse(rawOffices[1]);
	} catch (e) {
		pino.error(`Unable to parse offices response ${e['message']}`);

		return [];
	}

	if (!offices['length']) {
		pino.error('No offices years found. You should have a look');

		return [];
	}

	let formattedOffices = [];
	offices.forEach((o) => {
		let office = {
			name: o['label'],
			id: o['valore']
		};

		formattedOffices.push(office);
	});

	return formattedOffices;
};

/* Returns a list of rooms
 *
 * @param day (format dd-mm-yyyy)
 * @param office id
 */
const getRooms = async (officeId) => {
	let todayDate = new Date();
	let today = `${todayDate.getDate()}-${todayDate.getMonth() + 1}-${todayDate.getFullYear()}`;

	let response = await phin({
		url: POST_ROOMS_ENDPOINT,
		method: 'POST',
		timeout: PHIN_TIMEOUT,
		form: {
			_lang: 'it',
			date: today,
			sede: officeId,
			'form-type': 'rooms'
		}
	});
	
	if (response['statusCode'] != 200) {
		pino.error(`Invalid response from ${POST_TIMETABLE_ENDPOINT} (${response['statusCode']}): ${response['body']}`);

		return [];
	}

	let parsedResponse = { };
	try {
		parsedResponse = JSON.parse(response['body']);
	} catch (e) {
		pino.error(`Unable to parse response: ${e['message']}`);
		
		return;
	}

	if (!parsedResponse['events'] || !parsedResponse['order'] || !parsedResponse['area_rooms']) {
		pino.error('Unable to get rooms, response is invalid');

		return [];
	}

	let rooms = [];
	let roomsId = parsedResponse['order'];
	let roomsData = parsedResponse['area_rooms'][officeId];
	roomsId.forEach((roomId) => {
		// Get data from 'area_rooms'
		let roomData = roomsData[roomId];
		if (!roomData) {
			pino.error(`Room data for id ${roomId} not found`);
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

	return rooms;
};

module.exports = {
	getCourses: getCourses,
	getLessons: getLessons,
	getOffices: getOffices,
	getRooms: getRooms
};
