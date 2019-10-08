const Timber = require('@timberio/node').Timber;
const TimberTransport = require('@timberio/winston').TimberTransport;
const winston = require('winston');

const loggerTransports = [
	new winston.transports.Console()
];

if (process.env.TIMBER_API_KEY && process.env.TIMBER_SOURCE_ID) {
	const timber = new Timber(process.env.TIMBER_API_KEY, process.env.TIMBER_SOURCE_ID);
	loggerTransports.push(new TimberTransport(timber));
} else {
	console.warn('Missing Timber api key or source id. Logging to timber is disabled');
}

const logger = winston.createLogger({
	level: 'debug',
	transports: loggerTransports
});

module.exports = logger;
