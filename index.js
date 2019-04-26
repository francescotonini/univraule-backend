const logger = require('./lib/logger.js');
const server = require('./lib/server.js');

process.on('uncaughtException', (err) => {
	logger.error(err);
	process.exit(1);
});

// Starts the server
let port = process.env.PORT || 8080;
server.listen(port, () => {
	logger.info(`Listening on port ${port}`);
});
