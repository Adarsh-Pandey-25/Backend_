import {asyncHandler} from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';


const generateAccessAndRefreshToken= async (userId) => {
    try {
        const user= await User.findById(userId);
        const accessToken= user.generateAccessToken();
        const refreshToken= user.generateRefreshToken();

        user.refreshToken= refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};
    } catch (error) {
        throw new apiError(500, "Internal server error");   
    }
}

const registerUser= asyncHandler(async (req, res) => {
    
    
    const {fullName, email, userName, password} = req.body;
    if ([fullName, email, userName, password].some(field => !field || field.trim() === "")) {
        throw new apiError(400, "All fields are required");
      }
    const existedUser=await User.findOne({
        $or: [
            {email},
            {userName}
        ]
    })

    if (existedUser) {
        throw new apiError(408, "User with email or username already exists")
    }

    let avatarLocalPath;
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    
    

    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatarLocalPath = req.files.avatar[0].path;
    }
    if(!avatarLocalPath){
        throw new apiError(400,"Avatar is required");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new apiError(400,"Avatar is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        userName: userName.toLowerCase(),
        password,
    })

    const createdUser= await User.findById(user._id).select("-password -refreshToken -__v");
   
    if(!createdUser){
        throw new apiError(404,"User not found");
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
}
)

const loginUser= asyncHandler(async (req, res) => {
    const {email, userName, password}= req.body;
    if(!userName && !email){
        throw new apiError(400, "Email & username is required"); // not really being used

    }
    const user= await User.findOne({$and: [{email}, {userName}]})

    if(!user){
        throw new apiError(404, "User not found");
    }

    const isPasswordValid= await user.isPasswordCorrect(password)

    if (!isPasswordValid){
        throw new apiError(401, "Invalid password");
    }
    const {accessToken, refreshToken}=await generateAccessAndRefreshToken(user._id)

    const loggedInUser= await User.findById(user._id).select("-password -refreshToken -__v");
    const options={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,{
            user: loggedInUser,
            accessToken,
            refreshToken
        } , "User Logged in Successfully")
    )
}
)

const logoutUser= asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, 
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )
    
})

const refreshAccessToken= asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
        
        if(!incomingRefreshToken){
            throw new apiError(401, "Unauthorized request")
        }
    
        const decodedToken= jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET) 
    
        const user=await User.findById(decodedToken?._id).select("-password ")
        if(!user){
            throw new apiError(401, "Invalid refresh token")
        }   
        
        if(incomingRefreshToken !== user.refreshToken){
            throw new apiError(401, "Refresh Token is expired or invalid")
        }
    
        const options={
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshToken}= await generateAccessAndRefreshToken(user._id)
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {
                accessToken,
                newRefreshToken
            }, "Access token refreshed successfully")
        )
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid refresh token")
    }   
}
)

const changeCurrentPassword= asyncHandler(async (req, res) => {
    const {oldPassword, newPassword}= req.body;
    console.log(req.body);
    
    const user= await User.findById(req.user?._id)

    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new apiError(400, "Invalid password")
    }
    user.password= newPassword;
    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully")
    )   
})

const getCurrentUser= asyncHandler(async (req, res) => {
    const user= await User.findById(req.user?._id).select("-password -refreshToken -__v");
    if(!user){
        throw new apiError(404, "User not found");
    }
    return res.status(200)
    .json(
        new ApiResponse(200, req.user, "User fetched successfully")
    )
}
)

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email, userName} = req.body;
    console.log(req.body);
    
    if (!(fullName && email && userName)) {
        throw new apiError(400, "All fields are required");
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName,
                email,
                userName
            }
        },
        {
            new : true
        }
        
    ).select("-password -refreshToken -__v");
    return res.status(200)
    .json(
        new ApiResponse(200, user, "User updated successfully")
    )
}
)

const updateUserAvatar= asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar is required");
    }   

    const avatar= await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new apiError(400, "Error while uploading avatar");
    }

    await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, {
        new: true
    }
    ).select("-password -refreshToken -__v")
    return res.status(200)
    .json(
        new ApiResponse(200, {}, "Avatar updated successfully")
    )  
}
)

const updateUserCoverImage= asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new apiError(400, "Cover Image is required");
    }   

    const coverImage= await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new apiError(400, "Error while uploading avatar");
    }

    await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, {
        new: true
    }
    ).select("-password -refreshToken -__v")

    return res.status(200)
    .json(
        new ApiResponse(200, {}, "Cover image updated successfully")
    )   
}
)

const getUserChannelProfile= asyncHandler(async (req, res) => {
    const {username}= req.params;
    if(!username){
        throw new apiError(400, "Username is required");
    }

    const channel= await User.aggregate([
        {
            $match : {
                userName: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }                
            }
        },
        {
            $project: {
                _id: 1,
                fullName: 1,
                userName: 1,
                email: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1
            }
        }
    ])

    console.log(channel);
    if(!channel?.length){
        throw new apiError(404, "Channel doen't exists!!");
    }
    return res.status(200)
    .json(
        new ApiResponse(200, channel[0], "Channel fetched successfully")
    )   

})

const getWatchHistory= asyncHandler(async (req, res) => {
    const user= await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: ["$owner"]
                            }
                        }
                    }
                    
                ]
            }
        }
    ])

    res.status(200)
    .json(
        new ApiResponse(200, user[0]?.watchHistory || [], "Watch History fetched Successfully")
    )   
})



export {registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory
    }