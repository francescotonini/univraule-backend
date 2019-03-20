const server = require('./lib/server.js');

process.on('uncaughtException', (err) => {
	console.log(err['message']);
	process.exit(1);
});

// Starts the server
let port = process.env.PORT || 8080;
server.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
