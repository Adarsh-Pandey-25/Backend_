import mongoose, { Schema } from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        content :{
            type: String,
            required: true,
        },
        video:{
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true
        },
        owner:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
        }  
    },
    { timestamps: true }
)


export const comment = mongoose.model("Comment", commentSchema);