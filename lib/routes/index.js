const express   = require('express');
const courses   = require('./courses.js');
const lessons   = require('./lessons.js');
const offices   = require('./offices.js');
const rooms     = require('./rooms.js');
const teachings = require('./teachings.js');
const config    = require('./../config');

const router   = express.Router();

router.get('/courses', courses.get);
router.get('/academicyear/:academicYearId/course/:courseId/year/:yearId/lessons', lessons.get);
router.get('/academicyear/:academicYearId/course/:courseId/year/:yearId/teachings', teachings.get);
router.get('/academicyear/:academicYearId/course/:courseId/teachings', teachings.getAll);
router.get('/offices', offices.get);
router.get('/offices/:officeId/rooms', rooms.get);

module.exports = router;
