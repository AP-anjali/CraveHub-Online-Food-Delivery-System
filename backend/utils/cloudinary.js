import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';

const uploadOnCloudinary = async (file) => {

    cloudinary.config({
        cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
        api_key : process.env.CLOUDINARY_API_KEY,
        api_secret : process.env.CLOUDINARY_API_SECRET
    });

    try
    {
        const result = await cloudinary.uploader.upload(file);  // uploading file on cloudinary platform
        
        fs.unlinkSync(file);    // delete file from local storage

        return result.secure_url;
    }
    catch(error)
    {
        fs.unlinkSync(file);    // delete file from local storage for security purpose

        console.log(error);
    }
};

export default uploadOnCloudinary;