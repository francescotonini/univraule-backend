const Router    = require('koa-router');
const courses   = require('./courses.js');
const lessons   = require('./lessons.js');
const offices   = require('./offices.js');
const rooms     = require('./rooms.js');
const teachings = require('./teachings.js');

const router = Router({
	prefix: '/v1'
});

router.get('/courses', courses.get);
router.get('/academicyear/:academicYearId/course/:courseId/year/:yearId/lessons', lessons.get);
router.get('/offices', offices.get);
router.get('/offices/:officeId/rooms', rooms.get);
router.get('/academicyear/:academicYearId/course/:courseId/teachings', teachings.getAll);

module.exports = router.routes();
