const bole   = require('bole');
const server = require('./lib/server.js');

// Initialize the logger
bole.output([{ level: 'debug', stream: process.stdout }]);

const logger = bole('index');
process.on('uncaughtException', (err) => {
	logger.error(err);
	process.exit(1);
});

// Starts the server
let port = process.env.PORT || 8080;
server.listen(port, () => {
	logger.info(`Listening on port ${port}`);
});