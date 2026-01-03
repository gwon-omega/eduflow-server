import { Router } from "express";
import { login, logout, googleLogin } from "../controllers";

const router = Router();

router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/logout", logout);

export default router;
