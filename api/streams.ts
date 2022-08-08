import { Request, Response } from 'express';
import logger from './winston';

const fs = require('fs');
const readline = require('readline');

/* eslint consistent-return: off */

export async function getFiles(req: Request, res: Response) {
  try {
    const storagePath = process.env.STORAGE_PATH || '/tmp';
    if (!req.params.filename) {
      // health check
      const checkStorageRoot = fs.lstatSync(storagePath.replace(/\/+$/, ''));
      if (checkStorageRoot.isDirectory()) {
        return res.status(200).send('OK');
      }

      return res.sendStatus(400);
    }
    const filePath = `${storagePath.replace(/\/+$/, '')}/${decodeURIComponent(req.params.filename)}`;
    if (!fs.existsSync(filePath)) {
      logger.info(`${filePath} doesn't exist, ignoring stream request`);
      return res.sendStatus(404);
    }
    const checkFile = fs.lstatSync(filePath);
    if (checkFile.isDirectory()) {
      // list directory contents
      logger.info(`Listing directory contents: ${filePath}`);
      const files = fs.readdirSync(filePath);
      let fileListing = '';
      files.forEach((file: string) => {
        fileListing += `${file}\n`;
      });

      return res.status(200).send(fileListing);
    }

    // stream file
    const stream = fs.createReadStream(filePath);

    stream.on('open', () => {
      logger.info(`Preparing to read ${filePath}`);
      stream.pipe(res);
    });

    stream.on('data', () => {
      const read = parseInt(stream.bytesRead, 10);
      logger.info(`Processing  ...  ${read} bytes read`);
    });

    stream.on('close', () => {
      logger.info('Processing  ...  100%');
    });
  } catch (err) {
    logger.error(err);
    res.status(400).send(err);
  }
}

export async function getWC(req: Request, res: Response) {
  try {
    // outputs the equivalent of a Linux wc -l
    const storagePath = process.env.STORAGE_PATH || '/tmp';
    if (!req.params.filename) {
      return res.sendStatus(400);
    }
    const filePath = `${storagePath.replace(/\/+$/, '')}/${decodeURIComponent(req.params.filename)}`;
    if (!fs.existsSync(filePath)) {
      logger.info(`${filePath} doesn't exist, ignoring stream request`);
      return res.sendStatus(404);
    }
    // stream file
    const stream = fs.createReadStream(filePath);

    let lines = 0;
    const rl = readline.createInterface({
      input: stream,
      output: process.stdout,
    });
    rl.on('line', () => {
      lines += 1;
    });
    rl.on('close', () => res.status(200).send(lines.toString()));
  } catch (err) {
    logger.error(err);
    res.status(400).send(err);
  }
}

export async function postFile(req: Request, res: Response) {
  try {
    const storagePath = process.env.STORAGE_PATH || '/tmp';
    const url = decodeURIComponent(req.params.filename).replace(/^\/+/, '');
    const filePath = `${storagePath.replace(/\/+$/, '')}/${url}`;

    // directory creation, as necessary
    if (url.includes('/')) {
      const dirArr = filePath.split('/');
      dirArr.pop();
      const directories = dirArr.join('/');
      if (!fs.existsSync(directories)) {
        logger.info(`Creating ${directories}`);
        fs.mkdirSync(directories, {
          recursive: true,
        });
      }
    }

    const stream = fs.createWriteStream(filePath);

    stream.on('open', () => {
      logger.info(`Preparing to write ${filePath}`);
      req.pipe(stream);
    });

    stream.on('drain', () => {
      const written = parseInt(stream.bytesWritten, 10);
      logger.info(`Processing  ...  ${written} bytes written`);
    });

    stream.on('close', () => {
      logger.info('Processing  ...  100%');
      res.sendStatus(200);
    });

    stream.on('error', (err: string) => {
      logger.error(err);
      res.status(400).send(err);
    });
  } catch (e) {
    logger.error(e);
    res.status(400).send(e);
  }
}

export async function deleteFiles(req: Request, res: Response) {
  try {
    const storagePath = process.env.STORAGE_PATH || '/tmp';
    const filePath = `${storagePath.replace(/\/+$/, '')}/${decodeURIComponent(req.params.filename).replace(/^\/+/, '')}`;
    if (!fs.existsSync(filePath)) {
      logger.info(`${filePath} doesn't exist, ignoring delete request`);
      return res.sendStatus(200);
    }

    logger.info(`Deleting file/directory ${filePath}`);

    // inspect file
    const checkFile = fs.lstatSync(filePath);
    if (checkFile.isFile()) {
      fs.unlinkSync(filePath);
    } else if (checkFile.isDirectory()) {
      fs.rmdirSync(filePath, { recursive: true });
    }
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(400).send(e);
  }
}

export async function mvFile(req: Request, res: Response) {
  try {
    const storagePath = process.env.STORAGE_PATH || '/tmp';
    const url = decodeURIComponent(req.params.filename).replace(/^\/+/, '');
    const filePath = `${storagePath.replace(/\/+$/, '')}/${url}`;
    const newPath = `${storagePath.replace(/\/+$/, '')}/${decodeURIComponent(req.body.path).replace(/^\/+/, '')}`;

    if (!fs.existsSync(filePath)) {
      logger.info(`${filePath} doesn't exist, ignoring mv request`);
      return res.sendStatus(404);
    }
    // directory creation, as necessary
    if (url.includes('/')) {
      const dirArr = newPath.split('/');
      dirArr.pop();
      const directories = dirArr.join('/');
      if (!fs.existsSync(directories)) {
        logger.info(`Creating ${directories}`);
        fs.mkdirSync(directories, {
          recursive: true,
        });
      }
    }

    logger.info(`Moving file ${filePath} to ${newPath}`);

    fs.renameSync(filePath, newPath);
    return res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(400).send(e);
  }
}
