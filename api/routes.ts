import express from 'express';
var router = express.Router();
var streams = require('./streams');

router.get('/file', streams.get); // healthcheck
router.get('/file/:filename', streams.get);
router.post('/file/:filename', streams.post);
router.delete('/file/:filename', streams.delete);

module.exports = router;