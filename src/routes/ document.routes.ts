import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import { getDocumentsForReview, lawyerDecision, uploadDocument,getMyDocuments } from "../controllers/ document.controller";
import { authenticate } from "../middleware/ auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { reviewQueue } from "../controllers/ document.controller";


import { requestReview } from "../controllers/Request.review";


const router = Router();

router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  uploadDocument
);
// get doucments for lawayer and user 
router.get("/my-documents", authenticate, getMyDocuments);


router.get( "/review", authenticate,authorize(["LAWYER"]), getDocumentsForReview);

// GET Review  doucments list for Laywer only
router.get(
  "/review-queue",
  authenticate,
  authorize(["LAWYER"]),
  reviewQueue
);


router.patch(
  "/:id/decision",
  authenticate,
  authorize(["LAWYER"]),
  lawyerDecision
);


router.post("/:id/request-review", authenticate, requestReview);



export default router;
