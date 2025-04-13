import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js"
import uploadonCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

// Function to generate access token and refresh token
const generateAccessandRefreshToken = async (userid)=>{
    try{
        const user = await User.findById(userid)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // save refresh token to db
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}

    } catch(error){
        throw new ApiError(500, "Error generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {username, fullname, email, password} = req.body;
    console.log("Email: ", email);

    // Validation
    if(
        [username, fullname, email, password].some((field)=>{
            return field?.trim() ==="";
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existingUser){
        throw new ApiError(409, "User with email or username is already existing")
    }

    // Check for image and avatar
    console.log("Files: ", req.files.avatar[0]);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)
    const coverImage = await uploadonCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Error uploading avatar")
    }

    // Create user Object and create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Error creating user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // Get data from request body
    const {email, password} = req.body;

    // Validation
    if(!email || !password){
        throw new ApiError(400, "Both email and password are required")
    }

    // retrieve user from db
    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(404, "User not found")
    }

    // Verify password
    const isPasswordvalid = await user.isPasswordCorrect(password)
    if(!isPasswordvalid){
        throw new ApiError(401, "Invalid Password")
    }

    // Generate access token and refresh token
    const {accessToken, refreshToken} =  await generateAccessandRefreshToken(user._id)


    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // send cookies and response
    // set cookie options
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )


})

const logoutUser = asyncHandler(async (req, res) => {
    
})

export { 
    registerUser,
    loginUser
}