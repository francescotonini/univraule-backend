const express   = require('express');
const offices   = require('./offices.js');
const rooms     = require('./rooms.js');
const router    = express.Router();

router.get('/offices', offices.get);
router.get('/offices/:officeId/rooms', rooms.get);

module.exports = router;
