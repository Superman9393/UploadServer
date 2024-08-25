import  Upload  from "../models/Upload.js";
import { Router } from "express";
import dotenv from "dotenv";
import AWS from "aws-sdk";
import multer from "multer";


const router = Router();
const endPoint = process.env.EndPoint
const accessKey = process.env.AccessKey


router.post("/",(req,res)=>{

    const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
    const s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: 'ACCESSKEY',
        secretAccessKey: 'SECRETKEY'
    });
    
    const bucket = process.env.BUCKET // add details via dotenv
    const key = req.file.originalname
    const expireSeconds = 60 * 5
    const uploadParams = {
        Bucket: bucket,
        Key: key,
        Expires: expireSeconds,
        body: req.file.buffer,
        ContentType: req.file.mimetype
    };
    s3.upload(uploadParams, (err, data)=>{
        try{
            const url = s3.getSignedUrl('getObject', {
                Bucket: bucket,
                Key: key,
                Expires: expireSeconds
            })
            console.log(data.Location)
            let newUpload = new Upload({
                title:key,
                url:data.Location,
                description:req.body.description
            })
            (async () => await newUpload.save())();
            let details = {...newUpload._doc}
            console.log(`the file was uploaded at this ${url}`)
            res.status(200).json(details)
        }catch(err){
            console.log(err)
        }
        if(err){
            console.log(err)
        }
       
    })
    

})

export default router
