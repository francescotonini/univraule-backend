function ConnectionError(url) {
	this.statusCode = 500;
	this.code = 4;
	this.name = 'ConnectionError';
	this.message = `Unable to estabilish a connection to ${url}`;
}

module.exports = ConnectionError;
