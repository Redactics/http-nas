import express from 'express';
import { getFiles, postFile, deleteFiles } from './streams';

const router = express.Router();

router.get('/file', getFiles); // healthcheck
router.get('/file/:filename', getFiles);
router.post('/file/:filename', postFile);
router.delete('/file/:filename', deleteFiles);

export default router;
