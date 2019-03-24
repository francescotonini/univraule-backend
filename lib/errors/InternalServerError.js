function InternalServerError() {
	this.statusCode = 500;
	this.code = 1;
	this.name = 'InternalServerError';
	this.message = 'Server error. Something went wrong querying the database or processing the request.';
}

module.exports = InternalServerError;
