import mongoose, { Schema } from "mongoose";

const likeSchema = new mongoose.Schema(
    {
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true
        },
        comment:{
            type: Schema.Types.ObjectId,
            ref: "Comment",
            required: true
        },
        likedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        tweet:{
            type: Schema.Types.ObjectId,
            ref: "Tweet",
            required: true
        }
    },
    { timestamps: true }
)


export const Like = mongoose.model("Like", likeSchema);