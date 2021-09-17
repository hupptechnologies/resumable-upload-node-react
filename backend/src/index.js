const express = require("express");
const Busboy = require("busboy");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const {promisify} = require('util');
const app = express();
const getFileDetails = promisify(fs.stat);

app.use(express.json());
app.use(cors());

const getFilePath = (fileName, fileId) => `./uploads/file-${fileId}-${fileName}`;

const uniqueAlphaNumericId = () => {
	const heyStack = '0123456789abcdefghijklmnopqrstuvwxyz';
	const randomInt = () => Math.floor(Math.random() * Math.floor(heyStack.length));
    return randomInt;
}

app.post('/upload-request', (req, res) => {
	if (!req.body || !req.body.fileName) {
		res.status(400).json({message: 'Missing "fileName"'});
	} else {
		const fileId = uniqueAlphaNumericId();
		fs.createWriteStream(getFilePath(req.body.fileName, fileId), {flags: 'w'});
		res.status(200).json({fileId});
    }
});

app.get('/upload-status', (req, res) => {
	if(req.query && req.query.fileName && req.query.fileId) {
		getFileDetails(getFilePath(req.query.fileName, req.query.fileId))
			.then((stats) => {
				res.status(200).json({totalChunkUploaded: stats.size});
			})
			.catch(err => {
				console.error('failed to read file', err);
                fs.createWriteStream(getFilePath(req.query.fileName, req.query.fileId), {flags: 'w'});
                res.status(200).json({totalChunkUploaded: 0});				
			});
	}
});


app.post("/upload", (req, res) => {
    var busboy = new Busboy({ headers: req.headers });
    const fileId = req.headers['x-file-id'];

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
        const filePath = getFilePath(filename, fileId);

        file.pipe(fs.createWriteStream(filePath, {flags: 'a'}))
            .on('error', (e) => {
                console.error('failed upload', e);
                res.sendStatus(500);
            });
            
        file.on('data', function(data) {
            console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
        });
        file.on('end', function() {
            console.log('File [' + fieldname + '] Finished');
        });
    });
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        console.log('Field [' + fieldname + ']: value: ' + inspect(val));
    });
    busboy.on('finish', function() {
        console.log('Done parsing form!');
        res.send("SUCCESSS");
        res.end();       
        
    });
    req.pipe(busboy);
});

app.listen(5000, (err) => {
    if(err) {
        console.log("ERROR WHILE START SERVER", err);
        return;
    }
    console.log("SERVER STARTED ON PORT 5000");
})