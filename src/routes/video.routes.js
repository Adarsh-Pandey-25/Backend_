import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
import { publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
} from "../controllers/video.controller.js";
router.route("/publish-video").post(verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
        
    ]),
    publishAVideo
);

router.route("/get-video/:videoId").get(verifyJWT, getVideoById);


router.route("/update-video/:videoId").patch(verifyJWT,upload.fields([
    {
    name: "thumbnail",
    maxCount:1
}
]), updateVideo);


router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);

router.route("/toggle-publish-status/:videoId").patch(verifyJWT, togglePublishStatus);

router.route("/get-all-videos").get(verifyJWT, getAllVideos);
export default router;