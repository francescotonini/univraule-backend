function MissingFieldError(field) {
	this.statusCode = 400;
	this.code = 3;
	this.name = 'MissingFieldError';
	this.message = `${field} is missing`;
}

module.exports = MissingFieldError;
