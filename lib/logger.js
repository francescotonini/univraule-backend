const Timber = require('@timberio/node').Timber;
const logger = new Timber(process.env.TIMBER_API_KEY, process.env.TIMBER_SOURCE_ID);

logger.setSync((logs) => {
	logs.forEach((log) => console.log(log));
	
	return logs;
});

module.exports = logger;
