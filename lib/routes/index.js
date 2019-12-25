const express = require('express');
const verifier = require('alexa-verifier-middleware');
const bodyParser = require('body-parser');
const alexa = require('./alexa.js');
const offices = require('./offices.js');
const rooms = require('./rooms.js');
const cache = require('./../cache.js');
const router = express.Router();

const CACHE_INTERVAL = 30 * 60 * 1000;

router.get('/offices', cache(CACHE_INTERVAL), offices.get);
router.get('/offices/:officeId/rooms', rooms.get);
router.post('/alexa', verifier, bodyParser.json(), alexa.get);

module.exports = router;
