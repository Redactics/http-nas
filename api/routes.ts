var express = require('express');
var router = express.Router();
var streams = require('./streams');

router.get('/file/:filename', streams.get);
router.post('/file/:filename', streams.post);

module.exports = router;