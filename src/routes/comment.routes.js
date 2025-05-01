import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getAllComments,
    addComment,
    delComment,
    updateComment
} from "../controllers/comment.controller.js"


const router = Router()
router.use(verifyJWT)
router.route("/comments/:videoId").get(getAllComments).post(addComment)
router.route("/comments/:commentId").delete(delComment).patch(updateComment)
export default router