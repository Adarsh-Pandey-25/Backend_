import dotenv from 'dotenv';
import connectDB from './db/index.js';
import express from 'express';
import mongoose from 'mongoose';
import { DB_NAME } from './constants.js';
import { app } from './app.js';
dotenv.config({
    path: './config/config.env'
});


connectDB()
.then(()=>{
    console.log("Mongo DB connected");
    app.listen(process.env.PORT, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
}
)
.catch((error)=>{
    console.log("Mongo DB Connection Failed: ",error);
}
)
    








/*
import express from 'express';

const app = express();
(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, )
        app.on("error", (error)=>{
            console.error("ERROR: ",error);
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ",error);
        throw error
    }
})()
*/