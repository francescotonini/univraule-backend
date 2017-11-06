const fs     = require('fs');
const files  = fs.readdirSync(__dirname);
const errors = { };

files.forEach(function(file) {
	// Skip self
	if (file == 'index.js') {
		return;
	}
	
	if (file.match(/.*\.js/i)) {
		let mod = require('./' + file);
		let name = file.split('.')[0];
		errors[name] = mod;
	}
});

module.exports = errors;
