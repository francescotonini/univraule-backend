const express   = require('express');
const courses   = require('./courses.js');
const lessons   = require('./lessons.js');
const offices   = require('./offices.js');
const rooms     = require('./rooms.js');
const teachings = require('./teachings.js');
const config    = require('./../config');
const cache     = require('express-redis-cache')({
	host: config(['redis', 'host']),
	port: config(['redis', 'port']),
	expire: {
		201: config(['redis', 'cacheExpireInMinutes']) * 60 * 1000,
		XXX: 1
	}
});

const router   = express.Router();

router.get('/courses', cache.route(), courses.get);
router.get('/academicyear/:academicYearId/course/:courseId/year/:yearId/lessons', cache.route(), lessons.get);
router.get('/academicyear/:academicYearId/course/:courseId/year/:yearId/teachings', cache.route(), teachings.get);
router.get('/offices', cache.route(), offices.get);
router.get('/offices/:officeId/rooms', cache.route(), rooms.get);

module.exports = router;
