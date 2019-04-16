const express   = require('express');
const courses   = require('./courses.js');
const lessons   = require('./lessons.js');
const offices   = require('./offices.js');
const rooms     = require('./rooms.js');
const teachings = require('./teachings.js');
const cache     = require('./../cache.js');
const router    = express.Router();

const CACHE_INTERVAL = 30 * 60 * 1000;

router.get('/courses', cache(CACHE_INTERVAL), courses.get);
router.get('/academicyear/:academicYearId/course/:courseId/year/:yearId/lessons', cache(CACHE_INTERVAL), lessons.get);
router.get('/offices', cache(CACHE_INTERVAL), offices.get);
router.get('/offices/:officeId/rooms', cache(CACHE_INTERVAL), rooms.get);
router.get('/academicyear/:academicYearId/course/:courseId/teachings', cache(CACHE_INTERVAL), teachings.getAll);

module.exports = router;
