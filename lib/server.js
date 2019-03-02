const Koa    = require('koa');
const error  = require('koa-json-error');
const logger = require('koa-pino-logger');
const routes = require('./routes');
const api    = require('./api.js');
const app    = new Koa();

// Error handler
app.use(error((err) => {
	return {
		name: err.name,
		message: err.message,
		status: err.status || err.statusCode || 500
	};
}));

// Logger
app.use(logger());

// Add api object
app.context.api = api;

// Define routes
app.use(routes);

module.exports = app;
