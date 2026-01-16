import { BaseRepository } from "@core/repository/BaseRepository";
import { Institute } from "@prisma/client";

export class InstituteRepo extends BaseRepository<Institute> {
  constructor() {
    super("institute");
  }

  async findByOwner(userId: string) {
    return this.model.findMany({
      where: { ownerId: userId },
    });
  }

  async findByInstituteNumber(instituteNumber: number) {
    return this.model.findUnique({
      where: { instituteNumber },
    });
  }

  /**
   * Find institute by subdomain prefix (for duplicate checking)
   * Checks if any subdomain starts with the given prefix
   */
  async findBySubdomainPrefix(prefix: string): Promise<Institute | null> {
    return this.model.findFirst({
      where: {
        subdomain: {
          startsWith: prefix,
        },
      },
    });
  }

  /**
   * Find institute by exact subdomain
   */
  async findBySubdomain(subdomain: string): Promise<Institute | null> {
    return this.model.findUnique({
      where: { subdomain },
    });
  }

  /**
   * Search institutes by name, subdomain, or address (case-insensitive)
   */
  async search(query: string, skip: number = 0, take: number = 20) {
    const where = {
      OR: [
        { instituteName: { contains: query, mode: "insensitive" as const } },
        { subdomain: { contains: query, mode: "insensitive" as const } },
        { address: { contains: query, mode: "insensitive" as const } },
      ],
      // Only return institutes that are active/trial
      accountStatus: { in: ["active", "trial"] },
    };

    const [institutes, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          instituteName: true,
          subdomain: true,
          logo: true,
          address: true,
          type: true,
        },
        orderBy: { instituteName: "asc" },
      }),
      this.model.count({ where }),
    ]);

    return { institutes, total };
  }
}

export default new InstituteRepo();
