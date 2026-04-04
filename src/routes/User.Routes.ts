import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import { authenticate } from "../middleware/ auth.middleware";

import {
  uploadDocument,
  getMyDocuments,
  getDocumentDetails,
} from "../controllers/ document.controller";
import { requestReview } from "../controllers/Request.review";
import { authorize } from "../middleware/role.middleware";
import { runAIReview,createDocument } from "../controllers/ document.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/create",
  authorize(["USER"]),
  createDocument
);

router.post(
  "/:id/ai-review",
  authorize(['USER']),
  runAIReview
);
// Upload document
router.post(
  "/upload",
  authorize(['USER']),
  upload.single("file"),
  uploadDocument
);
console.log("USER ROUTER HIT");

// Get my documents
router.get("/my-documents", authenticate, getMyDocuments);

// Request lawyer review
router.post("/:id/request-review", authenticate, requestReview);

// Get document details (user can access own)
router.get("/:id", authenticate, getDocumentDetails);


export default router;