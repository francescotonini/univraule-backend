const chai   = require('chai');
const phin   = require('phin').unpromisified;
const async  = require('async');

chai.should();

process.on('unhandledRejection', (reason, p) => {
	throw new Error();
});

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080/v1';

describe('API Tests', () => {
	let offices = [];
	it('Should return a list of offices', (done) => {
		phin({
			url: `${BASE_URL}/offices`,
			method: 'GET',
			parse: 'json'
		}, (err, res) => {
			if (err) throw err;

			res.body.should.be.a('array');
			offices = res.body;
			offices.forEach((office) => {
				office['name'].should.be.a('string');
				office['id'].should.be.a('string');
			});

			done();
		});
	});

	it('Should return rooms for each office', (done) => {
		async.eachSeries(offices, (office, cb) => {
			let url = `${BASE_URL}/offices/${office['id']}/rooms`;
			console.log(`Processing ${url}`);

			phin({
				url: `${BASE_URL}/offices/${office['id']}/rooms`,
				method: 'GET',
				parse: 'json'
			}, (err, res) => {
				if (err) {
					cb(err);
					return;
				}

				res.body.should.be.a('array');
				res.body.forEach((room) => {
					room['name'].should.be.a('string');
					room['events'].should.be.a('array');
					room['events'].forEach((event) => {
						event['name'].should.be.a('string');
						(+event['startTimestamp']).should.be.a('number');
						(+event['endTimestamp']).should.be.a('number');
					});
				});

				cb();
			});
		}, (err) => {
			if (err) throw err;

			done();
		});
	});
});
