import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import { getDocumentsForReview, lawyerDecision, uploadDocument } from "../controllers/ document.controller";
import { authenticate } from "../middleware/ auth.middleware";
import { authorize } from "../middleware/role.middleware";


const router = Router();

router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  uploadDocument
);

router.get(
  "/review",
  authenticate,
  authorize(["LAWYER"]),
  getDocumentsForReview
);

router.patch(
  "/:id/decision",
  authenticate,
  authorize(["LAWYER"]),
  lawyerDecision
);



export default router;
