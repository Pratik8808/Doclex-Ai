import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import { getDocumentsForReview, lawyerDecision, uploadDocument,getMyDocuments, availableForReview, assignDocument, myAssignedDocuments, getDocumentDetails } from "../controllers/ document.controller";
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


// router.get(
//   "/review-queue",
//   authenticate,
//   authorize(["LAWYER"]),
//   reviewQueue
// );

// GET Review  doucments list for Laywer only
router.get(
  "/review-queue",
  authenticate,
  authorize(["LAWYER"]),
  availableForReview
);

// this route is for the lawyer and user both for current all doucmetns 
router.get( "/:id", authenticate, getDocumentDetails);


router.patch(
  "/:id/decision",
  authenticate,
  authorize(["LAWYER"]),
  lawyerDecision
);

//Lawyer will assigin only authorize as lawyer 
router.post("/:id/assign",authenticate,authorize(["LAWYER"]),assignDocument);

//Lawyer will assigned doucs
router.get("/my-assignments",authenticate,authorize(["LAWYER"]),myAssignedDocuments);



router.post("/:id/request-review", authenticate, requestReview);



export default router;
