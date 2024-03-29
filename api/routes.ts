import express from 'express';
import {
  getFiles, postFile, putFile, deleteFiles, mvFile, getWC,
} from './streams';

const router = express.Router();

router.get('/file', getFiles); // healthcheck
router.get('/file/:filename', getFiles);
router.get('/file/:filename/wc', getWC);
router.post('/file/:filename', postFile);
router.put('/file/:filename', putFile);
router.put('/file/:filename/mv', mvFile);
router.delete('/file/:filename', deleteFiles);

export default router;
