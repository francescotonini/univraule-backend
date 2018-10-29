const express   = require('express');
const offices   = require('./offices.js');
const rooms     = require('./rooms.js');
const alexa     = require('./alexa.js');
const router    = express.Router();

router.get('/offices', offices.get);
router.get('/offices/:officeId/rooms', rooms.get);
router.post('/alexa', alexa.get);

module.exports = router;
