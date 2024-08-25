import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from '@aws-sdk/client-s3';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import UploadModel from './models/Upload.js';
import multer from 'multer';
import { Readable } from 'stream';
import moongoose from 'mongoose'
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

moongoose.connect(process.env.CONNECTION_STRING,{serverSelectionTimeoutMS:5000, dbName:process.env.DB_NAME})
.then(console.log(`connected to database`))

// Configure multer to use memory storage
const _upload = multer({
  storage: multer.memoryStorage()
});

app.post("/upload", _upload.array('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  // Create S3 client
  const s3Client = new S3Client({
    endpoint: process.env.EndPoint,
    forcePathStyle: false,
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AccessKey,
      secretAccessKey: process.env.SecretAccessKey
    }
  });

  // Create a readable stream from the buffer
  const stream = Readable.from(file.buffer);

  // Configure the upload parameters
  const params = {
    Bucket: process.env.BUCKET,
    Key: file.originalname,
    Body: stream,
    ACL: "public-read",
  };
 
  try {
    // Use the Upload class for multipart upload
    const upload = new Upload({
      client: s3Client,
      params: params,
    });

    upload.on("httpUploadProgress", (progress) => {
      console.log(progress);
    });

    await upload.done();

    console.log(`Successfully uploaded object: ${params.Bucket}/${params.Key}`);
     // Create database object
    const UPLOAD = new UploadModel({
    title: file.originalname.trim(),
    url: `https://${process.env.BUCKET}.nyc3.cdn.digitaloceanspaces.com/${file.originalname}`,
    description: req.body.description
    });

    // Save to database
    const savedUpload = await UPLOAD.save();
    console.log(`Logged new entry id: ${savedUpload._id} at ${savedUpload.createdAt}`);
  
    console.log(savedUpload);

    res.status(200).json(savedUpload);
  } catch (err) {
    console.error("Error", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});
app.get("/videos", async (req, res) => {
    const videos = await UploadModel.find();
    console.log(videos);
    res.status(200).json(videos);
})
app.get("/upload/:id", async(req, res) => {
  let id = req.params.id;
  let target = await UploadModel.findById(id)
  if(!target)console.log('file could not be found')
  console.log(`target: ${target}`)
  res.status(200).json(target)
})
app.listen(process.env.PORT || 3000, () => console.log('Server is running'));