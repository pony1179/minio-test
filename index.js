var fs = require('fs')
const path = require('path');
const Minio = require('minio');
const multer = require('multer');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const body = req.body;
      const diskPath = `./upload/${body.subdomain ? body.subdomain : 'default'}/file/`;
      cb(null, diskPath);
    },
    filename: function (req, file, cb) {
      const body = req.body;
      const extname = path.extname(file.originalname);
      cb(null, `${Date.now()}${extname}`);
    }
});
const upload = multer({
    storage
});

const minioClient = new Minio.Client({
    endPoint: '47.104.21.57',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin'
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));

// 文件上传
router.post('/api/file/upload', async (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            res.status(400).json({
            error: true,
            msg: err.message
            });
        } else {
            next();
        }
    });
});

// 文件上传
router.post('/api/file/upload', function (req, res) {
    const { body, file } = req;
    const diskPath = `./upload/${body.subdomain ? body.subdomain : 'default'}/file/`;
    const filePath = path.join(diskPath, file.filename);
    const fileStream = fs.createReadStream(filePath);
    minioClient.putObject('keymantest', filePath, fileStream, function(err, etag) {
        if (err) {
            console.log(err);
            res.end(err.message);
        }
        fs.rmSync(filePath);
        res.send(`/${filePath}`);
    });
});

// 文件下载
router.get('/upload/:subdomain/*', function (req, res) {
    const url = req.url;
    const params = req.params;
    const fileName = params.fileName;
    minioClient.getObject('keymantest', url, function(err, dataStream) {
        dataStream.pipe(res);
        dataStream.on('close',()=>{
            res.end();
        })
    })
})

app.use(router);

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
})

