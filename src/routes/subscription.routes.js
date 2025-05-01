import { Router } from "express";
const router= Router();
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controller.js";


router.route("/toggle-subscription/:channelId").patch(verifyJWT, toggleSubscription);
router.route("/subscribers/:channelId").get(verifyJWT, getUserChannelSubscribers);
router.route("/subscribed-channels/:subscriberId").get(verifyJWT, getSubscribedChannels);

export default router