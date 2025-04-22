import {asyncHandler} from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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
    if(!email){
        throw new apiError(400, "Email or username is required");
    }
    const user= await User.findOne({$or: [{email}, {userName}]})

    if(!user){
        throw new apiError(404, "User not found");
    }

    const isPasswordValid= await user.ispasswordCorrect(password)

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
            $set: {
                refreshToken: undefined
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
export {registerUser,
        loginUser,
        logoutUser
    }