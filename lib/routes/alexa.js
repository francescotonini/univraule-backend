const data = require('./../api.js');
const apl = require('./../static/apl.json');
const logger = require('./../logger.js');
const async = require('async');

let processStaticResponses = (type, intent) => {
	if (type === 'IntentRequest' && (intent['name'] === 'AMAZON.CancelIntent' ||
		intent['name'] === 'AMAZON.StopIntent' || intent['name'] === 'AMAZON.NavigateHomeIntent')) {
		logger.info('Received a stop intent from Alexa');

		let ssml = '<speak><say-as interpret-as=\'interjection\'>D\'accordo</say-as></speak>';
		let text = 'D\'accordo';

		let response = {
			version: '1.0',
			response: {
				outputSpeech: {
					type: 'SSML',
					ssml: ssml
				},
				card: {
					type: 'Simple',
					title: 'Aule informatica',
					content: text
				}
			}
		};

		return response;
	}
	else if (type === 'IntentRequest' && intent['name'] === 'AMAZON.HelpIntent') {
		logger.info('Received a help intent from Alexa');

		let ssml = '<speak>Per sapere quali sono le aule libere del dipartimento di informatica dell\'Università di Verona, pronuncia "Alexa, domanda ad aule informatica quali aule sono libere".</speak>';
		let text = 'Pronuncia "Alexa, domanda ad aule informatica quali aule sono libere"';

		let response = {
			version: '1.0',
			response: {
				outputSpeech: {
					type: 'SSML',
					ssml: ssml
				},
				card: {
					type: 'Simple',
					title: 'Aule informatica',
					content: text
				}
			}
		};

		return response;
	}

	return null;
};

let processDynamicResponses = (rooms) => {
	rooms = rooms.filter((x) => x['name'].toLowerCase().indexOf('sala') == -1 &&
		x['name'].toLowerCase().indexOf('laboratorio') == -1);

	let ssml = '';
	let text = '';

	apl.datasources.listTemplate1ListData.totalNumberOfItems = 0;
	apl.datasources.listTemplate1ListData.listPage.listItems = [];
	if (rooms['length'] != 0) {
		let start_interjections = [
			'Aloha',
			'Bene',
			'Bip bip',
			'Certo',
			'Come desideri',
			'Come vuoi',
			'D\'accordo',
			'Mamma mia',
			'Spoiler alert',
			'Taac'
		];

		let interjection = start_interjections[Math.floor(Math.random() * start_interjections['length'])];
		ssml += `<speak><say-as interpret-as='interjection'>${interjection}</say-as>! `;
		ssml += 'Ecco le aule al momento libere: ';
		rooms.forEach((room) => {
			let date = new Date(room['until']);
			let hour = date.getHours();
			let minutes = date.getMinutes();
			minutes = ('0' + minutes).slice(-2); // pad zero to the left

			text += `${room['name']} - ${hour}:${minutes}. \n`;

			const roomName = room['name'];
			if (room['name']['length'] == 1) {
				room['name'] = `<emphasis level='strong'>${room['name']}</emphasis>`;
			}

			ssml += `<s>${room['name']} fino alle ${hour}:${minutes}. </s> `;

			apl.datasources.listTemplate1ListData.totalNumberOfItems++;
			apl.datasources.listTemplate1ListData.listPage.listItems.push({
				listItemIdentifier: roomName,
				ordinalNumber: 2,
				textContent: {
					primaryText: {
						type: 'PlainText',
						text: roomName
					},
					secondaryText: {
						type: 'RichText',
						text: 'Libera fino alle'
					},
					tertiaryText: {
						type: 'PlainText',
						text: `${hour}:${minutes}`
					}
				},
				token: roomName
			});
		});

		ssml += '</speak>';
	}
	else {
		ssml += '<speak><say-as interpret-as=\'interjection\'>Oh no</say-as>! Tutte le aule sono al momento occupate!</speak>';
		text += 'Tutte le aule sono al momento occupate!';
	}

	let response = {
		version: '1.0',
		response: {
			outputSpeech: {
				type: 'SSML',
				ssml: ssml
			},
			card: {
				type: 'Simple',
				title: 'Aule informatica',
				content: text
			},
			directives: [
				{
					type: 'Alexa.Presentation.APL.RenderDocument',
					document: apl.document,
					datasources: apl.datasources
				}
			]
		}
	};

	return response;
};

let getFreeRooms = (rooms) => {
	let freeRooms = [];
	rooms.forEach((room) => {
		let now = new Date();
		if (now.getDay() == 0) {
			// Today is sunday
			return;
		}

		let currentEvent = room['events'].find((x) => x['startTimestamp'] * 1000 <= now.getTime() && now.getTime() <= x['endTimestamp'] * 1000);
		let nextEvent = room['events'].find((x) => x['startTimestamp'] * 1000 >= now.getTime());

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

	return freeRooms;
};

const alexa = {
	get: (req, res, next) => {
		const officeIds = [1, 2, 3];

		let request = req['body']['request'];
		let type = request['type'];
		let intent = request['intent'];

		let staticResponse = processStaticResponses(type, intent);
		if (staticResponse) {
			res.sendData(200, staticResponse);
		}
		else {
			logger.info('Received a \'aule libere\' intent for univr from Alexa');

			async.map(officeIds, (officeId, cb) => {
				data.getRooms(officeId, cb);
			}, (err, arrayOfArrayOfRooms) => {
				if (err) {
					throw err;
				}

				// Flatten array, sort alphabetically and exclude rooms with name "ufficio"
				let rooms = [].concat.apply([], arrayOfArrayOfRooms)
					.sort((x, y) => x['name'].localeCompare(y['name']))
					.filter((x) => x['name'].toLowerCase().indexOf('ufficio') == -1);

				let response = processDynamicResponses(getFreeRooms(rooms));

				// Remove APL directive if device isn't compatible
				const device = req['body']['context']['System']['device'];
				if (device && (!device['supportedInterfaces'] || !device['supportedInterfaces']['Alexa.Presentation.APL'])) {
					delete response.response.directives;
				}

				res.sendData(200, response);
			});
		}
	}
};

module.exports = alexa;
