import app from "../api/app"
import request from 'supertest';
const agent = request.agent(app);

var fs = require('fs');

beforeAll(done => {
  process.env.NODE_ENV = 'test';
  done();
})

afterAll(done => {
  done();
});

const createEmptyFileOfSize = (fileName, size) => {
  return new Promise((resolve, reject) => {
    // Check size
    if (size < 0) {
      reject("Error: a negative size doesn't make any sense")
      return;
    }

    // Will do the processing asynchronously
    setTimeout(() => {
      try {
        // Open the file for writing; 'w' creates the file 
        // (if it doesn't exist) or truncates it (if it exists)
        var fd = fs.openSync(fileName, 'w');
        if (size > 0) {
          // Write one byte (with code 0) at the desired offset
          // This forces the expanding of the file and fills the gap
          // with characters with code 0
          fs.writeSync(fd, Buffer.alloc(1), 0, 1, size - 1);
        }
        // Close the file to commit the changes to the file system
        fs.closeSync(fd);

        // Promise fulfilled
        resolve(true);
      } catch (error) {
        // Promise rejected
        reject(error);
      }
      // Create the file after the processing of the current JavaScript event loop
    }, 0)
  });
};

describe('Stream methods user', () => {
  it('healthcheck', async () => {
    const res = await agent.get('/file');

    expect(res.status).toBe(200);
  });

  it('check for non-existing file', async () => {
    const res = await agent.get('/file/blah');

    expect(res.status).toBe(404);
  });

  it('create small file', async () => {
    const res = await agent.post('/file/testfile')
    .send("file contents")

    expect(res.status).toBe(200);
  });

  it('stream small file', async () => {
    const res = await agent.get('/file/testfile')

    expect(res.status).toBe(200);
    expect(res.text).toBe('file contents')
  });

  it('create small file in directory', async () => {
    const res = await agent.post('/file/testdir%2Ftestfile2')
    .send("file contents in directory")

    expect(res.status).toBe(200);
  });

  it('create multi-line file', async () => {
    const res = await agent.post('/file/testfileML')
    .send("file contents\nline2\nline3")

    expect(res.status).toBe(200);
  });

  it('get linecount on multi-line file', async () => {
    const res = await agent.get('/file/testfileML/wc')

    expect(res.status).toBe(200);
    expect(res.text).toBe('3')
  })

  it('check that parent directory was created', async () => {
    expect(fs.existsSync('/tmp/testdir')).toBe(true);
  })

  it('stream small file from directory', async () => {
    const res = await agent.get('/file/testdir%2Ftestfile2')

    expect(res.status).toBe(200);
    expect(res.text).toBe('file contents in directory')
  });

  it('get directory listing', async () => {
    const res = await agent.get('/file/testdir');

    expect(res.status).toBe(200);
    expect(res.text).toBe("testfile2\n")
  });

  it('create large file in directory', async () => {
    jest.setTimeout(60000);

    // Create a file of 1 GiB
    return createEmptyFileOfSize('/tmp/largefileinput', 1024*1024*1024)
    .then(async () => {
      var largefile = fs.readFileSync('/tmp/largefileinput');
    
      const res = await agent.post('/file/testdir%2Flargefile')
      .send(largefile)

      largefile = "";
      expect(res.status).toBe(200);
      expect(fs.existsSync('/tmp/testdir/largefile')).toBe(true);
    });
  });

  it('get directory listing, expecting two files', async () => {
    const res = await agent.get('/file/testdir');

    expect(res.status).toBe(200);
    expect(res.text).toBe("largefile\ntestfile2\n")
  });

  // TODO: superagent returns "Maximum response size reached" with this test, fix this later
  // it('stream large file', async () => {
  //   jest.setTimeout(30000);
  //   const res = await agent.get('/file/testdir%2Flargefile');
    
  //   expect(res.status).toBe(200);
  // });

  it('attempt to mv a file that doesn\'t exist', async () => {
    const res = await agent.put('/file/nofile.txt', {
      path: "nofilemoved.txt"
    });

    expect(res.status).toBe(404);
  });

  it('mv largefile in same directory', async () => {
    const res = await agent.put('/file/testdir%2Flargefile')
    .send({
      path: "testdir%2Flargefilemoved"
    })

    expect(res.status).toBe(200);
    expect(fs.existsSync('/tmp/testdir/largefilemoved')).toBe(true);
  });

  it('mv largefile to a new directory', async () => {
    const res = await agent.put('/file/testdir%2Flargefilemoved')
    .send({
      path: "testmoved%2Flargefilemoved"
    })

    expect(res.status).toBe(200);
    expect(fs.existsSync('/tmp/testmoved/largefilemoved')).toBe(true);
  });

  it('delete largefileinput', async () => {
    const res = await agent.delete('/file/largefileinput');

    expect(res.status).toBe(200);
    expect(fs.existsSync('/tmp/largefileinput')).toBe(false);
  });

  it('delete testfile', async () => {
    const res = await agent.delete('/file/testfile');

    expect(res.status).toBe(200);
    expect(fs.existsSync('/tmp/testfile')).toBe(false);
  });

  it('delete testdir', async () => {
    const res = await agent.delete('/file/testdir');

    expect(res.status).toBe(200);
    expect(fs.existsSync('/tmp/testdir')).toBe(false);
  });

  it('delete testmoved', async () => {
    const res = await agent.delete('/file/testmoved');

    expect(res.status).toBe(200);
    expect(fs.existsSync('/tmp/testmoved')).toBe(false);
  });
})