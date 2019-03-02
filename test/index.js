const chai   = require('chai');
const phin   = require('phin').unpromisified;
const async  = require('async');

chai.should();

// const BASE_URL = process.env.BASE_URL || 'localhost:80';
const BASE_URL = 'http://localhost:8080/v1';

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
						event['startTimestamp'].should.be.a('number');
						event['endTimestamp'].should.be.a('number');
					});
				});

				cb();
			});
		}, (err) => {
			if (err) throw err;

			done();
		});
	});

	let courses = [];
	it('Should return a list of courses', (done) => {
		phin({
			url: `${BASE_URL}/courses`,
			method: 'GET',
			parse: 'json'
		}, (err, res) => {
			if (err) throw err;

			res.body.should.be.a('array');
			courses = res.body;
			courses.forEach((course) => {
				course['name'].should.be.a('string');
				course['academicYearId'].should.be.a('string');
				course['id'].should.be.a('string');
				course['years'].should.be.a('array');

				course['years'].forEach((year) => {
					year['name'].should.be.a('string');
					year['id'].should.be.a('string');
				});
			});

			done();
		});
	});

	it('Should return a timetable for year in each course', (done) => {
		async.eachSeries(courses, (course, cb) => {
			async.eachSeries(course['years'], (year, cb) => {
				let url = `${BASE_URL}/academicyear/${course['academicYearId']}/course/${course['id']}/year/${year['id']}/lessons`;
				console.log(`Processing ${url}`);
	
				phin({
					url: url,
					method: 'GET',
					parse: 'json'
				}, (err, res) => {
					if (err) {
						cb(err);
						return;
					}
	
					res.body.should.be.a('array');
					res.body.forEach((lesson) => {
						lesson['name'].should.be.a('string');
						lesson['teacher'].should.be.a('string');
						lesson['startTimestamp'].should.be.a('number');
						lesson['endTimestamp'].should.be.a('number');
						lesson['teacher'].should.be.a('string');
					});
	
					cb();
				});
			}, cb);
		}, (err) => {
			if (err) throw err;

			done();
		});
	});
});