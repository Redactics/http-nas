import express from 'express';
import {
  getFiles, postFile, deleteFiles, mvFile, getWC,
} from './streams';

const router = express.Router();

router.get('/file', getFiles); // healthcheck
router.get('/file/:filename', getFiles);
router.get('/file/:filename/wc', getWC);
router.post('/file/:filename', postFile);
router.put('/file/:filename', mvFile);
router.delete('/file/:filename', deleteFiles);

export default router;
