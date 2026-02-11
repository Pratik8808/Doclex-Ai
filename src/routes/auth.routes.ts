import { Router } from "express";
import { register, login } from "../controllers/ auth.controller";
import { authenticate } from "../middleware/ auth.middleware";

const router = Router();



router.post("/register", register);
router.post("/login", login);

router.get("/me", authenticate, (req, res) => {
  res.json({
    message: "Protected route working",
    user: req.user,
  });
});

export default router;
