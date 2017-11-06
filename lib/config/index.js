const config = require('./config.json');

/* Returns the value associated to a unique key(s)
 *
 * @param {string/array} key(s)
 * @return {null/object} value associated
 */
module.exports = (keys) => {
	if (!Array.isArray(keys)) {
		keys = [keys];
	}

	let value = Object.assign({ }, config);
	keys.every((key) => {
		value = value[key];

		// Ops!
		if (!value) {
			value = null;
			return false;
		}

		return true;
	});

	return value;
};
