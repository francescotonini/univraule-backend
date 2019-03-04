const pino   = require('pino')();
const config = require('./lib/config');
const server = require('./lib/server.js');

process.on('uncaughtException', (err) => {
	pino.error(err);
	process.exit(1);
});

// Starts the server
let port = process.env.PORT || config(['server', 'port']) || 8080;
server.listen(port, () => {
	pino.info(`Listening on port ${config(['server', 'port'])}`);
});
