import { Router } from "express";
import { aiReview } from "../controllers/ai.controller";
import { authenticate } from "../middleware/ auth.middleware";
import { chatController } from "../controllers/ document.controller";

const router = Router();

router.post("/:id/ai-review", authenticate, aiReview);




// 🔐 Both USER + LAWYER can access
router.post("/chat", authenticate, chatController);


export default router;