import { S3 } from "@aws-sdk/client-s3";
import AWS from 'aws-sdk'
import dotenv from 'dotenv'
dotenv.config()
const s3Client = new S3({
    forcePathStyle: false, // Configures to use subdomain/virtual calling format.
    endpoint: "https://nyc3.digitaloceanspaces.com",
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AccessKey,
      secretAccessKey: process.env.SecretAccessKey
    }
});


export { s3Client };


