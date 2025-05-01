import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {apiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

// used for getting video duration automatically from the uploaded video File

import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
ffmpeg.setFfmpegPath(ffmpegStatic)
ffmpeg.setFfprobePath(ffprobeStatic.path)

const getVideoDuration = (filePath) => {
    try {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) return reject(err)
                resolve(metadata.format.duration)
            })
        })
    } catch (error) {
        console.error("Error getting video duration:", error)
        throw new apiError(500, "Error getting video duration")
    }
}



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    console.log(req.query);
    const skip = (page - 1) * limit
    const sort = {}
    if (sortBy && sortType) {
        sort[sortBy] = sortType === "asc" ? 1 : -1
    }
    const filter = {}
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ]
    }
    if (req.user.role === "user") {
        filter.isPublished = true
    }
    if (req.user.role === "admin") {
        filter.isPublished = { $ne: false }
    }
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new apiError(400, "Invalid user id")
        }
        filter.owner = userId
    }
    const videos = await Video.find(filter)
        .populate("owner", "fullName email watchHistory")
        .sort(sort)
        .skip(skip)
        .limit(limit)
    if (!videos) {
        throw new apiError(400, "Videos not found")
    }
    const totalVideos = await Video.countDocuments(filter)
    const totalPages = Math.ceil(totalVideos / limit)
    return res.status(200).json({
        success: true,
        message: "Videos fetched successfully",
        data: videos,
        totalPages,
        currentPage: page,
        totalVideos,
    })
    
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(req.files.videoFile== null || req.files.thumbnail== null){
        throw new apiError(400, "Video file and thumbnail are required")
    }
    const uploadedVideo=await uploadOnCloudinary(req.files.videoFile[0].path, "video")
    const uploadedThumbnail=await uploadOnCloudinary(req.files.thumbnail[0].path, "image")
    const duration = await getVideoDuration(req.files.videoFile[0].path)
    
    const video = await Video.create({
        title,
        description,
        videoFile: uploadedVideo.secure_url,
        thumbnail: uploadedThumbnail.secure_url,
        duration,
        owner: req.user._id
    })
    if (!video) {
        throw new apiError(400, "Video not created")
    }
    const user = await User.findById(req.user._id)
    if (!user) {
        throw new apiError(400, "User not found")
    }
    await user.save()
    return res.status(200).json({
        success: true,
        message: "Video created successfully",
        data: video,
    })
    // TODO: get video, upload to cloudinary, create video

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!isValidObjectId(videoId)){
        throw new apiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId).populate("owner", "fullName email watchHistory")
    if (!video) {
        throw new apiError(400, "Video not found")
    }
    return res.status(200).json({
        success: true,
        message: "Video fetched successfully",
        data: video,
    })

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!isValidObjectId(videoId)){
        throw new apiError(400, "Invalid video id")
    }
    const video= await Video.findById(videoId)
    if(!video){
        throw new apiError(400, "Video not found")
    }
    const { title, description} = req.body
    if(!title || !description){
        throw new apiError(400, "Title and description are required")
    }
    
    const updateThumbnail= await uploadOnCloudinary(req.files?.thumbnail[0].path, "image")
   
        
    const updatedDetails = await Video.findByIdAndUpdate(videoId, {
        title,
        description,
        thumbnail: updateThumbnail?.secure_url
    }, { new: true }
)
    if (!updatedDetails) {
        throw new apiError(400, "Video not updated")
    }
    return res.status(200).json({
        success: true,
        message: "Video updated successfully",
        data: updatedDetails,
    })      

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) {
        throw apiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new apiError(400, "Video not found")
    }
    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if (!deletedVideo) {
        throw new apiError(400, "Video not deleted")
    }
    return res.status(200).json({
        success: true,
        message: "Video deleted successfully",
        data: deletedVideo,
    })  
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) {
        throw apiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new apiError(400, "Video not found")
    }
    video.isPublished= !(video.isPublished);
   const updatedPublishedStatus=await video.save()
    

    
    if (!updatedPublishedStatus) {
        throw new apiError(400, "Video not found")
    }
    return res.status(200).json({
        success: true,
        message: "Video publish status updated successfully",
        data: updatedPublishedStatus,
    })    

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}