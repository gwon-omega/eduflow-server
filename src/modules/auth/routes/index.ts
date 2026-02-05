import { Router } from "express";
import { login, logout, googleLogin, register, verifyEmail, resendVerification } from "../controllers";
import { getCloudinarySignature } from "../controllers/getCloudinarySignature";
import { forgotPassword, resetPassword } from "../controllers/forgotPassword.controller";
import { getMe } from "../controllers/getMe.controller";
import { updateProfile } from "../controllers/updateProfile.controller";
import { updateProfileImage } from "../controllers/updateProfileImage.controller";
import { authenticate } from "../../../core/middleware/authenticate";
import { emailResendLimiter } from "../../../core/middleware/rateLimiter";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/google-login", googleLogin);

// Email verification routes
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", emailResendLimiter, resendVerification);

// Password reset routes
router.post("/forgot-password", emailResendLimiter, forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/logout", logout);

// Profile routes (authenticated)
router.get("/profile", authenticate, getMe); // Map /profile to getMe for convenience or specialized controller
router.put("/profile", authenticate, updateProfile);
router.post("/profile/image", authenticate, updateProfileImage);

// Get current user (authenticated)
router.get("/me", authenticate, getMe);

// Cloudinary signature endpoint (authenticated)
router.get("/cloudinary-sign", authenticate, getCloudinarySignature);

export default router;
