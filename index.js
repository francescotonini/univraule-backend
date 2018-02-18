const bole   = require('bole');
const config = require('./lib/config');
const server = require('./lib/server.js');

// Initialize the logger
bole.output([{ level: config('logLevel'), stream: process.stdout }]);

const logger = bole('index');
process.on('uncaughtException', (err) => {
	opbeat.captureError(err);
	logger.error(err);
	process.exit(1);
});

// Starts the server
server.listen(config(['server', 'port']), () => {
	logger.info(`Listening on port ${config(['server', 'port'])}`);
});
