const express = require('express');
const app = express();
const models = require('./models/post')
const bodyParser = require('body-parser')
const promBundle = require("express-prom-bundle");
const config = require('./system-life');
const middlewares = require('./middleware')
var multer = require('multer')
const { v4: uuidv4 } = require('uuid');
const { S3Client } = require('@aws-sdk/client-s3')
const fs = require('fs');
const multerS3 = require('multer-s3')
const os = require('os')

const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    includeUp: true,
    promClient: {
        collectDefaultMetrics: {
        }
    }
});

app.use(middlewares.countRequests)
app.use(metricsMiddleware)
app.use(config.middlewares.healthMid);
app.use('/', config.routers);
app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('view engine', 'ejs');

const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_ACCESS_SECRET = process.env.AWS_ACCESS_SECRET;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const STORAGE_TYPE = process.env.STORAGE_TYPE || "LOCAL";

let upload;

if (STORAGE_TYPE === "LOCAL") {

    const dirName = 'image_public/'

    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, dirName)
        },
        filename: function (req, file, cb) {
            cb(null, uuidv4() + '.jpg')
        }
    });

    upload = multer({ storage: storage });
} else {
    // S3
    const s3Client = new S3Client({
        credentials: {
            accessKeyId: AWS_ACCESS_KEY,
            secretAccessKey: AWS_ACCESS_SECRET
        }, region: AWS_REGION
    })

    upload = multer({
        storage: multerS3({
            s3: s3Client,
            bucket: AWS_S3_BUCKET_NAME,
            acl: 'public-read',
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            key: function (req, file, cb) {
                cb(null, uuidv4() + '.jpg')
            }
        })
    });
}

app.get('/post', (req, res) => {
    res.render('edit-news', { post: { title: "", content: "", summary: "" }, valido: true });
});

const cpUpload = upload.fields([{ name: 'sampleFile', maxCount: 1 }])
app.post('/post', cpUpload, async (req, res) => {

    let valid = true;

    if ((req.body.title.length !== 0 && req.body.title.length < 30) &&
        (req.body.resumo.length !== 0 && req.body.resumo.length < 50) &&
        (req.body.description.length !== 0 && req.body.description.length < 2000)) {
        valid = true;
    } else {
        valid = false;
    }

    if (valid) {

        let fileName;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }

        if (STORAGE_TYPE === "LOCAL") {
            // Local
            fileName = "/image/" + req.files['sampleFile'][0].filename;
        } else {
            // S3
            fileName = req.files['sampleFile'][0].location;
        }

        await models.Post.create({
            title: req.body.title,
            content: req.body.description,
            summary: req.body.resumo,
            image: fileName,
            publishDate: Date.now()
        });

        res.redirect('/');

    } else {
        res.render('edit-news', { post: { title: req.body.title, content: req.body.description, summary: req.body.resumo }, valido: false });
    }

});

app.post('/api/post', async (req, res) => {

    console.log(req.body.artigos)
    for (const item of req.body.artigos) {

        await models.Post.create({ title: item.title, content: item.description, summary: item.resumo, publishDate: Date.now() });
    }

    res.json(req.body.artigos)
});

app.get('/post/:id', async (req, res) => {

    const post = await models.Post.findByPk(req.params.id);
    res.render('view-news', { post: post });
});

app.get('/image/:imagem', async function (req, res) {

    res.download('image_public/' + req.params.imagem)
});

app.get('/info', async (req, res) => {

    const pjson = require('./package.json');
    console.log(pjson.version);
    res.render('info', { maquina: os.hostname, versao: pjson.version});
});

app.get('/', async (req, res) => {

    const posts = await models.Post.findAll();
    res.render('index', { posts: posts });
});

models.initDatabase();
app.listen(8080);

console.log('Aplicação rodando na porta 8080');