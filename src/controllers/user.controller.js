import {asyncHandler} from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
const registerUser= asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "User registered successfully",
    })
    const {fullName, email, userName, password} = req.body;
    if(
        [
            fullName,email, userName, password
        ].some((fields)=>fields?.trim()==="")
    ){
        throw new apiError("All fields are required", 400);
    }

    const existedUser=User.findOne({
        $or: [
            {email},
            {userName}
        ]
    })
    if(existedUser){
        throw new apiError("User already exists", 400);
    }

    const avatarLocalPath= req.files?.avatar[0]?.path
    const coverImageLocalPath= req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new apiError("Avatar is required", 400);
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new apiError("Avatar is required", 400);
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
        throw new apiError("User not found", 404);
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
}
)

export {registerUser}