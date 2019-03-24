function UnknownEndpointError() {
	this.statusCode = 404;
	this.code = 2;
	this.name = 'UnknownEndpointError';
	this.message = 'Unknown endpoint.';
}

module.exports = UnknownEndpointError;
