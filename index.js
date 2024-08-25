import AWS from 'aws-sdk'
import multers3 from 'multer-s3'
import multer from 'multer'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import { s3Client } from './controlers/s3.js'
import { PutObjectCommand } from '@aws-sdk/client-s3';
import UploadModel from './models/Upload.js'
import fs from 'fs'
import cors from 'cors'
dotenv.config()
AWS.config.update({
    accessKeyId: process.env.AccessKey,
    secretAccessKey: process.env.SecretAccessKey
});
const s3 = s3Client;
const upload = multer({
    storage: multers3({
        s3: s3,
        bucket: process.env.BUCKET,
        ACL: 'public-read',
        contentType: multer.AUTO,
        Body: req.file.buffer,
    }
});
const Connect = async()=>{
    try{
        await mongoose.connect(process.env.CONNECTION_STRING,{serverSelectionTimeoutMS:5000, dbName:process.env.DB_NAME})
        .then(console.log(`connected to databawse`))
    }catch(err){
        console.log(err)
    } 
   
}
Connect();
const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/upload', upload.single('file'),(req, res) => {
    const readStream = fs.createReadStream(req.file.path);
    const params = {
        Bucket: process.env.BUCKET,
        Key: req.file.originalname,
        Body: req.file.buffer,
        ACL: 'public-read',
        ContentType: req.file.mimetype
    }
    try {
      const uploadObject = async () => {
      const data = s3Client.send(new PutObjectCommand(params));
      const location = await data.location;
      console.log("Successfully uploaded object: " + data.Location);
      let newUpload = await new UploadModel({
        title:req.file.originalname,
        url:`https://${process.env.BUCKET}.nyc3.cdn.digitaloceanspaces.com/${req.file.originalname}`,
        description:req.body.description
      })
      let details = {...newUpload._doc}
      newUpload = await newUpload.save() 
        .then((data) => console.log(`logged new entry id: ${data._id} at ${data.createdAt}`))
      res.status(200).json({uploadedFile:details})
      res.end()
      return data;
    }
    uploadObject();
    } catch (err) {
      console.log("Error", err);
    }
    })

app.listen(process.env.PORT || 3000,()=>console.log('server is running'))
