import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const user= await User.findById(req.user._id)
    const userId = user._id
   
    if (!videoId) {
        throw new apiError(400, "Video Id is required")
    }
    if (!userId) {
        throw new apiError(400, "User Id is required")
    }
    if (!isValidObjectId(userId)) {
        throw new apiError(400, "Invalid user id")
    }    
    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid video id")
    }
    const video = await Like.findOne({video: videoId, likedBy: userId})
    if (video) {
        await Like.findByIdAndDelete(video._id)
        return res.status(200).json({
            success: true,
            message: "Video unliked"
        })
    }
    const newLike = await Like.create({
        video: videoId,
        likedBy: userId
    })
    if (!newLike) {
        return new apiError(500, "Unable to like video")
    }
    return res.status(201).json({
        success: true,
        message: "Video liked",
        data: newLike
    })
})
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user
    const likedVideos = await Like.find({likedBy: userId}).populate("video")
    
    if (likedVideos.length===0 ) {
        throw new apiError(404, "No liked videos found")
    }
    return res.status(200).json({
        success: true,
        message: "Liked videos fetched",
        data: likedVideos
    })
})

export {
    toggleVideoLike,
    getLikedVideos
}