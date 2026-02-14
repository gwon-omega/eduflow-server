import { BaseRepository } from "./BaseRepository";
import prisma from "../database/prisma";

export abstract class TenantRepository<T> extends BaseRepository<T> {
  constructor(modelName: string) {
    super(modelName);
  }

  /**
   * Enforced findById with institute isolation
   */
  async findByIdAndTenant(id: string, instituteId: string): Promise<T | null> {
    return this.model.findFirst({
      where: { id, instituteId, deletedAt: null },
    });
  }

  /**
   * Enforced findMany with institute isolation
   */
  async findManyByTenant(params: {
    instituteId: string;
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
  }): Promise<T[]> {
    const where = { ...params.where, instituteId: params.instituteId, deletedAt: null };
    return this.model.findMany({ ...params, where });
  }

  /**
   * Enforced soft delete with institute isolation
   */
  async deleteByTenant(id: string, instituteId: string): Promise<T> {
    return this.model.update({
      where: { id, instituteId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Enforced update with institute isolation
   */
  async updateByTenant(id: string, instituteId: string, data: any): Promise<T> {
    return this.model.update({
      where: { id, instituteId },
      data,
    });
  }

  /**
   * Enforced count with institute isolation
   */
  /**
   * Enforced upsert with institute isolation
   */
  async upsertByTenant(params: {
    where: any;
    update: any;
    create: any;
    instituteId: string;
    include?: any;
  }): Promise<T> {
    const where = { ...params.where, instituteId: params.instituteId };
    const create = { ...params.create, instituteId: params.instituteId };
    return this.model.upsert({
      ...params,
      where,
      create,
    });
  }
}
