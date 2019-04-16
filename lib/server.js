const express     = require('express');
const bodyParser  = require('body-parser');
const compress    = require('compression');
const morgan      = require('morgan');
const errors      = require('./errors');
const logger      = require('./logger.js');
const app         = express();

// Logger, compression, bodyparser
app.use(morgan('tiny'));
app.use(compress());
app.use(bodyParser.json());

app.use((req, res, next) => {
	res.sendData = (code, data) => {
		res.status(code);
		res.json(data);
	};

	next();
});

app.use('/v1', require('./routes'));

// If you are here... well, bad luck for you
app.use((req, res, next) => {
	let err = new errors.UnknownEndpointError();
	next(err);
});

// Handles error
app.use((err, req, res, next) => {
	if (!err['code'] || !err['message']) {
		logger.error(err);
		err = new errors.InternalServerError();
	}

	let	error = {
		code: err['code'],
		name: err['name'],
		message: err['message']
	};

	res.status(err['statusCode']);
	res.json(error);
});

module.exports = app;
