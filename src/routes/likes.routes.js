import { Router } from "express";
const router = Router();    
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleVideoLike, getLikedVideos } from "../controllers/like.controller.js";

router.route("/toggle-like/:videoId").post(verifyJWT,toggleVideoLike)
router.route("/liked-videos").get(verifyJWT,getLikedVideos)
export default router;