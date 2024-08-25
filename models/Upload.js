import mongoose from 'mongoose'
//create model for upload to server

const UploadSchema = new mongoose.Schema({
    title:{type:String,required:true},
    url:{type:String,required:true},
    description:{type:String,required:true},
},{timestamps:true}) 

const UploadModel = mongoose.model('Upload',UploadSchema)
export default UploadModel