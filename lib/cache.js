const cache = require('memory-cache');

module.exports = (duration) => {
	return (req, res, next) => {
		let key = '__express__' + req['originalUrl'] || req['url'];
		let cached = cache.get(key);

		if (cached) {
			res.sendData(200, cached);
			return;
		}
		else {
			res.sendData = (code, data) => {
				if (code == 200) {
					cache.put(key, data, duration);
				}

				res.status(code);
				res.json(data);
			};

			next();
		}
	};
};
