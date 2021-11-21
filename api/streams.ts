// TODO: Typescript support
//import { Request, Response } from 'express';
var http = require('http');
var fs = require('fs');

exports.get = async function(req, res) {
  try {
    const filePath = process.env.STORAGE_PATH.replace(/\/+$/,'') + "/" + decodeURIComponent(req.params.filename);
    if (!fs.existsSync(filePath)) {
      console.log(`${filePath} doesn't exist, ignoring stream request`);
      return res.sendStatus(404);
    }
    const checkFile = fs.lstatSync(filePath);
    if (checkFile.isDirectory()) {
      // list directory contents
      console.log(`Listing directory contents: ${filePath}`)
      const files = fs.readdirSync(filePath);
      var fileListing = "";
      files.forEach(file => {
        fileListing += file + "\n";
      });

      return res.send(fileListing);
    }


    const stream = fs.createReadStream(filePath);

    stream.on('open', () => {
      console.log(`Preparing to read ${filePath}`);
      stream.pipe(res);
    });

    stream.on('data', () => {
      const read = parseInt(stream.bytesRead);
      console.log(`Processing  ...  ${read} bytes read`);
    });

    stream.on('close', () => {
      console.log('Processing  ...  100%');
    });
  }
  catch(err) {
    console.log("CATCH ERROR", e)
    res.status(400).send(err);
  }
}

exports.post = async function(req, res) {
  try {
    const storagePath = decodeURIComponent(req.params.filename).replace(/^\/+/,'');
    const filePath = process.env.STORAGE_PATH.replace(/\/+$/,'') + "/" + storagePath;

    // directory creation, as necessary
    if (storagePath.includes('/')) {
      var dirArr = filePath.split('/');
      dirArr.pop();
      const directories = dirArr.join('/');
      if (!fs.existsSync(directories)) {
        console.log(`Creating ${directories}`);
        const createDir = fs.mkdirSync(directories, {
          recursive: true
        });
      }
    }

    const stream = fs.createWriteStream(filePath);
   
    stream.on('open', () => {
      console.log(`Preparing to write ${filePath}`);
      req.pipe(stream);
    });

    stream.on('drain', () => {
      const written = parseInt(stream.bytesWritten);
      console.log(`Processing  ...  ${written} bytes written`);
    });

    stream.on('close', () => {
      console.log('Processing  ...  100%');
      res.sendStatus(200);
    });
    
    stream.on('error', err => {
      console.error(err);
      res.status(400).send(err);
    });
  }
  catch(e) {
    console.log("ERROR", e)
    res.status(400).send(e);
  }
}

exports.delete = async function(req, res) {
  try {
    const filePath = process.env.STORAGE_PATH.replace(/\/+$/,'') + "/" + decodeURIComponent(req.params.filename).replace(/^\/+/,'');
    if (!fs.existsSync(filePath)) {
      console.log(`${filePath} doesn't exist, ignoring delete request`);
      return res.sendStatus(200);
    }

    console.log(`Deleting file/directory ${filePath}`)

    // inspect file
    const checkFile = fs.lstatSync(filePath);
    if (checkFile.isFile()) {
      fs.unlinkSync(filePath);
    }
    else if (checkFile.isDirectory()) {
      fs.rmdirSync(filePath, { recursive: true });
    }
    res.sendStatus(200);
  }
  catch(e) {
    console.log("ERROR", e)
    res.status(400).send(e);
  }
}