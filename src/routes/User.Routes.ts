import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import { authenticate } from "../middleware/ auth.middleware";

import {
  uploadDocument,
  getMyDocuments,
  getDocumentDetails,
} from "../controllers/ document.controller";
import { requestReview } from "../controllers/Request.review";

const router = Router();

// Upload document
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  uploadDocument
);

// Get my documents
router.get("/my-documents", authenticate, getMyDocuments);

// Request lawyer review
router.post("/:id/request-review", authenticate, requestReview);

// Get document details (user can access own)
router.get("/:id", authenticate, getDocumentDetails);

export default router;