import { Router } from "express";
import { authenticate } from "../middleware/ auth.middleware";
import { authorize } from "../middleware/role.middleware";

import {
  availableForReview,
  assignDocument,
  myAssignedDocuments,
  lawyerDecision,
  getDocumentDetails,
} from "../controllers/ document.controller";

const router = Router();

// Only LAWYER access
router.use(authenticate, authorize(["LAWYER"]));

// Get available documents (not assigned)
router.get("/review-queue", availableForReview);

// Assign document
router.post("/:id/assign", assignDocument);

// Get my assigned documents
router.get(
  "/my-assignments",
  authenticate,          
  authorize(["LAWYER"]), 
  myAssignedDocuments
);

// Approve / Reject
router.patch("/:id/decision", lawyerDecision);

// View document
router.get("/:id", getDocumentDetails);

export default router;