import mongoose, { Schema } from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        videos: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Video',
                required: true
            }
        ],
        owner:{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true }
)
export const Playlist = mongoose.model("Playlist", playlistSchema);
