import { Response } from "express";
import prisma from "@core/database/prisma";
import { IExtendedRequest } from "@core/middleware/type";

/**
 * Get all blog posts
 * GET /api/blog
 */
export const getAllBlogPosts = async (req: IExtendedRequest, res: Response) => {
  try {
    const isPublished = req.query.isPublished === "true";
    const authorId = req.query.authorId as string;

    const where: any = {};
    if (req.query.isPublished !== undefined) {
      where.isPublished = isPublished;
    }
    if (authorId) {
      where.authorId = authorId;
    }

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          }
        }
      }
    });

    return res.status(200).json({ success: true, data: blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get blog post by slug
 * GET /api/blog/:slug
 */
export const getBlogPostBySlug = async (req: IExtendedRequest, res: Response) => {
  try {
    const { slug } = req.params;

    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          }
        }
      }
    });

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog post not found" });
    }

    return res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Create blog post
 * POST /api/blog
 */
export const createBlogPost = async (req: IExtendedRequest, res: Response) => {
  try {
    const { title, slug, content, excerpt, thumbnail, isPublished } = req.body;
    const authorId = req.user?.id;

    if (!authorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user?.role !== "super-admin" && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        thumbnail,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        authorId,
      }
    });

    return res.status(201).json({ success: true, data: blog });
  } catch (error: any) {
    console.error("Error creating blog post:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: "Slug must be unique" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Update blog post
 * PUT /api/blog/:id
 */
export const updateBlogPost = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, slug, content, excerpt, thumbnail, isPublished } = req.body;

    if (req.user?.role !== "super-admin" && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const existingBlog = await prisma.blog.findUnique({ where: { id } });
    if (!existingBlog) {
      return res.status(404).json({ success: false, message: "Blog post not found" });
    }

    const updateData: any = {
      title,
      slug,
      content,
      excerpt,
      thumbnail,
      isPublished,
    };

    if (isPublished && !existingBlog.isPublished) {
      updateData.publishedAt = new Date();
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json({ success: true, data: blog });
  } catch (error: any) {
    console.error("Error updating blog post:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: "Slug must be unique" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Delete blog post
 * DELETE /api/blog/:id
 */
export const deleteBlogPost = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.role !== "super-admin" && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await prisma.blog.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
