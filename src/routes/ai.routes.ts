import { Router } from "express";
import { aiReview } from "../controllers/ai.controller";
import { authenticate } from "../middleware/ auth.middleware";

const router = Router();

router.post("/:id/ai-review", authenticate, aiReview);

export default router;