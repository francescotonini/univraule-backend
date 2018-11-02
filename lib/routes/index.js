const express     = require('express');
const offices     = require('./offices.js');
const rooms       = require('./rooms.js');
const alexa       = require('./alexa.js');
const verifier    = require('alexa-verifier-middleware');
const bodyParser  = require('body-parser');
const router      = express.Router();

router.get('/offices', bodyParser.json(), offices.get);
router.get('/offices/:officeId/rooms', bodyParser.json(), rooms.get);
router.post('/alexa', verifier, bodyParser.json(), alexa.get);

module.exports = router;
