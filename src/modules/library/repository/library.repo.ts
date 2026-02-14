import { TenantRepository } from "@core/repository/TenantRepository";
import { LibraryResource, LibraryBorrow } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class LibraryRepo extends TenantRepository<LibraryResource> {
  constructor() {
    super("libraryResource");
  }

  async findByInstitute(instituteId: string, filters: any) {
    const { search, categoryId, status, type } = filters;

    const where: any = {
      // instituteId and deletedAt are handled if we use findManyByTenant,
      // but here we have custom logic for search, so we'll pass to findManyByTenant
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId && categoryId !== "All Categories") {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Leveraging enforced tenant isolation
    return this.findManyByTenant({
      instituteId,
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findBorrowHistory(studentId: string, instituteId: string) {
    return (prisma as any).libraryBorrow.findMany({
      where: {
        studentId,
        resource: { instituteId },
      },
      include: {
        resource: {
          select: { title: true, author: true, isbn: true },
        },
      },
      orderBy: { borrowedAt: "desc" },
    });
  }
}

export default new LibraryRepo();
