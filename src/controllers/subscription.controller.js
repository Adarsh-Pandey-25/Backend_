import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {apiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId =req.user._id
    
    if (!isValidObjectId(channelId)) {
        throw new apiError(400, "Invalid channel id")
    }
    if (!isValidObjectId(userId)) {
        throw new apiError(400, "Invalid user id")
    }
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new apiError(400, "Channel not found")
    }
    const subscriber = await User.findById(userId)
    if (!subscriber) {
        throw new apiError(400, "Subscriber not found")
    }

    const channelObjectId = new mongoose.Types.ObjectId(channelId);
    if (channelObjectId.equals(userId)) {
        throw new apiError(400, "You cannot subscribe to your own channel")
        
    }
    const subscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    if (subscription) {
        // unsubscribe
        const deletedSubscription = await Subscription.findByIdAndDelete(subscription._id)
        if (!deletedSubscription) {
            throw new apiError(400, "Subscription not deleted")
        }
        return res.status(200).json({
            success: true,
            message: "Unsubscribed successfully",
            data: deletedSubscription
        })
    } else {
        // subscribe
        const newSubscription = await Subscription.create({
            subscriber: userId,
            channel: channelId
        })
        if (!newSubscription) {
            throw new apiError(400, "Subscription not created")
        }
        return res.status(200).json({
            success: true,
            message: "Subscribed successfully",
            data: newSubscription
        })
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id
    if (!isValidObjectId(channelId)) {
        throw new apiError(400, "Invalid channel id")
    }
    if (!isValidObjectId(userId)) {
        throw new apiError(400, "Invalid user id")
    }
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new apiError(400, "Channel not found")
    }
    const subscriber = await User.findById(userId)
    if (!subscriber) {
        throw new apiError(400, "Subscriber not found")
    }
    const subscribers = await Subscription.find({
        channel: channelId
    }).populate("subscriber", "name profilePic")
    if (!subscribers) {
        throw new apiError(400, "No subscribers found")
    }
    return res.status(200).json({
        success: true,
        message: "Subscribers fetched successfully",
        data: subscribers
    })
}
)


const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const userId = req.user._id
    if (!isValidObjectId(subscriberId)) {
        throw new apiError(400, "Invalid subscriber id")
    }
    if (!isValidObjectId(userId)) {
        throw new apiError(400, "Invalid user id")
    }
    const subscriptions= await Subscription.find({
        subscriber: subscriberId
    }).populate("channel", "avatar")
    if (!subscriptions || subscriptions.length === 0) {
        throw new apiError(400, "No subscriptions found")
    }

    const channels = subscriptions.map((subscription) => {
        return {
            channelId: subscription.channel._id,
            name: subscription.channel.name,
            avatar: subscription.channel.avatar
        }
    })
    return res.status(200).json({
        success: true,
        message: "Subscribed channels fetched successfully",
        data: channels
    })
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}