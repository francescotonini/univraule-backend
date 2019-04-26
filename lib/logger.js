const Timber          = require('@timberio/node').Timber;
const TimberTranspost = require('@timberio/winston').TimberTransport;
const winston         = require('winston');

const logger = winston.createLogger({
	level: 'debug',
	transports: [
		new TimberTranspost(new Timber(process.env.TIMBER_API_KEY, process.env.TIMBER_SOURCE_ID)),
		new winston.transports.Console()
	]
});

module.exports = logger;
