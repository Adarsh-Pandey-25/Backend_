import {comment} from "../models/comment.model.js"
import { apiError } from "../utils/apiError.js"
import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllComments = async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid video id")
    }
    const comments = await comment.find({ video: videoId })
        .populate("owner", "name email")
        .populate("video", "title description")
        .sort({ createdAt: -1 })
    if (!comments) {
        throw new apiError(400, "No comments found")
    }
    return res.status(200).json({
        success: true,
        message: "Comments fetched successfully",
        data: comments,
    })
}
const addComment = async (req, res) => {
    const { videoId } = req.params
    const { text } = req.body
    
    
    if(!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid video id")
    }
    if (!text) {
        throw new apiError(400, "Comment text is required")
    }
    const newComment = await comment.create({
        owner: req.user._id,
        video: videoId,
        comment: text,
    })
    if (!newComment) {
        throw new apiError(400, "Comment not added")
    }
    return res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: newComment,
    })
}

const delComment= async(req,res)=>{
    const {commentId}= req.params
    if(!commentId){
        throw new apiError(400,"Video Id is required")
    }
    if(!isValidObjectId(commentId)){
        throw new apiError(400,"Invalid Video Id")
    }

    
    const delComment= await comment.findByIdAndDelete(commentId)
    if(!delComment){
        throw new apiError(400,"Comment not found")
    }
    const user= await User.findById(req.user._id)
    if(!user){
        throw new apiError(400,"User not found")
    }
    await user.save()
    return res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
        data: delComment,
    })  

}

const updateComment = async (req, res) => {
    const {commentId}= req.params
    const { text } = req.body
    
    if(!commentId){
        throw new apiError(400,"Comment Id is required")
    }
    if(!isValidObjectId(commentId)){
        throw new apiError(400,"Invalid Comment Id")
    }

    if (!text) {
        throw new apiError(400, "Comment text is required")
    }
    const updatedComent= await comment.findByIdAndUpdate(commentId,{
        comment: text,
    },{new:true})
    if(!updatedComent){
        throw new apiError(400,"Comment not updated")
    }
    return res.status(200).json({
        success: true,
        message: "Comment updated successfully",
        data: updatedComent,
    })
}  
export { getAllComments,
     addComment,
     delComment,
     updateComment
     }