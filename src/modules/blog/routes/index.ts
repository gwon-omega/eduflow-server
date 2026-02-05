import { Router } from "express";
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost
} from "../controllers/blog.controller";
import { authenticate } from "../../../core/middleware/authenticate";

const router = Router();

// Public routes
router.get("/", getAllBlogPosts);
router.get("/:slug", getBlogPostBySlug);

// Protected routes (Admin/Super-Admin)
router.post("/", authenticate, createBlogPost);
router.put("/:id", authenticate, updateBlogPost);
router.delete("/:id", authenticate, deleteBlogPost);

export default router;
