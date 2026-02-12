import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import { uploadDocument } from "../controllers/ document.controller";
import { authenticate } from "../middleware/ auth.middleware";

const router = Router();

router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  uploadDocument
);

export default router;
