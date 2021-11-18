// TODO: Typescript support
//import { Request, Response } from 'express';
var http = require('http');
var fs = require('fs');

exports.get = async function(req, res) {
  try {
    const filePath = process.env.MOUNT_PATH.replace(/\/+$/,'') + "/" + req.params.filename;
    const stream = fs.createReadStream(filePath);

    stream.on('open', () => {
      console.log(`Preparing to read ${filePath}`);
      stream.pipe(res);
    });

    stream.on('data', () => {
      const read = parseInt(stream.bytesRead);
      console.log(`Processing  ...  ${read} bytes read`);
    });
  }
  catch(e) {
    console.log("CATCH ERROR", e)
    //Sentry.captureException(e);
    res.status(400).send(e);
  }
}

exports.post = async function(req, res) {
  try {
    // pg_dump -U postgres -w  -Fc -d postgres | curl -X POST -H "Transfer-Encoding: chunked" --data-binary @- http://host.docker.internal:4000/file/filename
    // curl http://host.docker.internal:4000/file/filename | pg_restore -c -U postgres -w -d test
    // https://dev.to/tqbit/how-to-use-node-js-streams-for-fileupload-4m1n

    const filePath = process.env.MOUNT_PATH.replace(/\/+$/,'') + "/" + req.params.filename;
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
    // If something goes wrong, reject the primise
    stream.on('error', err => {
      console.error(err);
      reject(err);
    });
  }
  catch(e) {
    console.log("ERROR", e)
    //Sentry.captureException(e);
    res.status(400).send(e);
  }
}