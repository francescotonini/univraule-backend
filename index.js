const pino   = require('pino')();
const config = require('./lib/config');
const server = require('./lib/server.js');

process.on('uncaughtException', (err) => {
	pino.error(err);
	process.exit(1);
});

// Starts the server
server.listen(config(['server', 'port']), () => {
	pino.info(`Listening on port ${config(['server', 'port'])}`);
});
