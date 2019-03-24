function ConnectionError() {
	this.statusCode = 500;
	this.code = 3;
	this.name = 'ConnectionError';
	this.message = 'Unable to estabilish a connection with the service';
}

module.exports = ConnectionError;
