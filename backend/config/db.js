import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDb = async () => {
    try 
    {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("database connected..!");
    } 
    catch (error) 
    {
        console.error(`database connection error : ${error.message}`);
    }
};

export default connectDb;