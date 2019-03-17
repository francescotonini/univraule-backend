const pino   = require('pino')();
const server = require('./lib/server.js');

process.on('uncaughtException', (err) => {
	pino.error(err);
	process.exit(1);
});

// Starts the server
let port = process.env.PORT || 8080;
server.listen(port, () => {
	pino.info(`Listening on port ${port}`);
});
