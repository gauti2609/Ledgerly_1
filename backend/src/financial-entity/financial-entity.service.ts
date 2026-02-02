import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationService } from '../validation/validation.service';

@Injectable()
export class FinancialEntityService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService
  ) { }

  async create(user: any, name: string, entityType: string, financialYear: string, confirmNew?: boolean, linkToCode?: string) {
    if (!user.tenantId) {
      throw new Error('User is not assigned to a tenant');
    }

    // 1. Duplicate/Similarity Check (if not forcibly confirming new or linking)
    if (!confirmNew && !linkToCode) {
      const existing = await this.prisma.financialEntity.findMany({
        where: {
          tenantId: user.tenantId,
          isSoftDeleted: false,
          name: { equals: name } // basic strict check, can be 'contains' for looser match
        },
        select: { id: true, name: true, financialYear: true, companyCode: true }
      });

      // Simple case-insensitive match on name
      const matches = existing.filter(e => e.name.toLowerCase().trim() === name.toLowerCase().trim());

      if (matches.length > 0) {
        return {
          status: 'POSSIBLE_MATCHES',
          matches
        }; // Controller should handle this response
      }
    }

    // 2. Determine Company Code
    const companyCode = linkToCode || `EC-${Date.now().toString().slice(-6)}`;

    return this.prisma.financialEntity.create({
      data: {
        name,
        entityType,
        financialYear: financialYear || "2024-2025",
        companyCode,
        userId: user.userId,
        tenantId: user.tenantId,
        data: "{}",
      } as any,
    });
  }

  async findAll(user: any) {
    if (user.role === 'PLATFORM_ADMIN') {
      return this.prisma.financialEntity.findMany({
        where: { isSoftDeleted: false },
        select: { id: true, name: true, entityType: true, financialYear: true, companyCode: true, createdAt: true, updatedAt: true, tenantId: true },
      });
    }

    if (user.role === 'TENANT_ADMIN') {
      if (!user.tenantId) return [];
      return this.prisma.financialEntity.findMany({
        where: {
          tenantId: user.tenantId,
          isSoftDeleted: false,
          User_FinancialEntity_userIdToUser: {
            // Only show entities created by users within the tenant who are NOT Platform Admins
            role: { not: 'PLATFORM_ADMIN' }
          }
        },
        select: { id: true, name: true, entityType: true, financialYear: true, companyCode: true, createdAt: true, updatedAt: true },
      });
    }

    // Entity Admin, Manager, Executive - can only see their assigned entity OR entities they "own" (legacy)
    // Preference: Assigned Entity
    if (user.entityId) {
      return this.prisma.financialEntity.findMany({
        where: { id: user.entityId, isSoftDeleted: false },
        select: { id: true, name: true, entityType: true, financialYear: true, companyCode: true, createdAt: true, updatedAt: true },
      });
    }

    // Fallback: Legacy owner
    return this.prisma.financialEntity.findMany({
      where: { userId: user.userId, isSoftDeleted: false },
      select: {
        id: true,
        name: true,
        entityType: true,
        financialYear: true,
        companyCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string, user: any) {
    // Access Control
    const whereClause: any = { id, isSoftDeleted: false };

    if (user.role === 'PLATFORM_ADMIN') {
      // No restriction
    } else if (user.role === 'TENANT_ADMIN') {
      whereClause.tenantId = user.tenantId;
      whereClause.User_FinancialEntity_userIdToUser = { role: { not: 'PLATFORM_ADMIN' } };
    } else if (user.entityId) {
      // Restricted to assigned entity
      if (user.entityId !== id) {
        throw new NotFoundException('Entity not found or access denied');
      }
      whereClause.id = user.entityId;
    } else {
      // Legacy fallback
      whereClause.userId = user.userId;
    }

    const entity = await this.prisma.financialEntity.findFirst({
      where: whereClause,
    });
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }
    return typeof entity.data === 'string' ? JSON.parse(entity.data) : entity.data;
  }

  async update(id: string, user: any, data: any) {
    // Access Control
    const whereClause: any = { id, isSoftDeleted: false };

    // Strict checks
    if (user.role === 'TENANT_ADMIN') {
      whereClause.tenantId = user.tenantId;
      whereClause.User_FinancialEntity_userIdToUser = { role: { not: 'PLATFORM_ADMIN' } };
    } else if (user.role !== 'PLATFORM_ADMIN') {
      if (!user.tenantId) throw new NotFoundException('Access denied');
      whereClause.tenantId = user.tenantId;
    }

    if (user.entityId && user.entityId !== id) {
      throw new NotFoundException('Access denied');
    }

    const entity = await this.prisma.financialEntity.findFirst({
      where: whereClause,
    });
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    // Validate Data before Saving
    this.validationService.validateFinancialData(data);

    return this.prisma.financialEntity.update({
      where: { id: entity.id },
      data: { data: typeof data === 'string' ? data : JSON.stringify(data) },
    });
  }

  async remove(id: string, user: any) {
    // Only Admin roles should be able to reach here via Controller, but double check data ownership
    const whereClause: any = { id, isSoftDeleted: false };

    if (user.role === 'TENANT_ADMIN') {
      whereClause.tenantId = user.tenantId;
      whereClause.User_FinancialEntity_userIdToUser = { role: { not: 'PLATFORM_ADMIN' } };
    } else if (user.role !== 'PLATFORM_ADMIN') {
      if (!user.tenantId) throw new NotFoundException('Access denied');
      whereClause.tenantId = user.tenantId;
    }

    const entity = await this.prisma.financialEntity.findFirst({
      where: whereClause,
    });
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    // Soft Delete
    await this.prisma.financialEntity.update({
      where: { id: entity.id },
      data: {
        isSoftDeleted: true,
        deletedAt: new Date()
      }
    });
  }

  /**
   * Retrieves mapped ledgers from ALL financial entities to serve as global training examples for AI.
   * Returns a deduplicated list of verified mappings.
   */
  async getGlobalMappedLedgers(limit: number = 1000): Promise<Array<{ name: string; majorHead: string; minorHead: string; grouping: string }>> {
    // Fetch all entities (or recent ones)
    const entities = await this.prisma.financialEntity.findMany({
      where: { isSoftDeleted: false },
      select: { data: true, name: true },
      orderBy: { updatedAt: 'desc' },
      take: 100 // Look at last 100 active entities (increased from 50)
    });

    const mappedLedgersMap = new Map<string, { name: string; majorHead: string; minorHead: string; grouping: string }>();

    for (const entity of entities) {
      const data = typeof entity.data === 'string' ? JSON.parse(entity.data) : entity.data;
      if (data && Array.isArray(data.trialBalance)) {
        for (const item of data.trialBalance) {
          // Debug logging for TCS items
          if (item.ledger && item.ledger.toLowerCase().includes('tcs')) {
            console.log(`[GlobalMap Debug] Checking ${item.ledger} from ${entity.name}: isMapped=${item.isMapped}, Major=${item.majorHeadCode}`);
          }

          if (item.isMapped && item.majorHeadCode && item.minorHeadCode && item.groupingCode) {
            // Use ledger name as key to deduplicate. 
            // Since we iterate entities by desc update, newer mappings might overwrite older ones (which is good)
            // BUT within an entity array, order is arbitrary? Usually existing.
            // Let's just store simple dedupe.
            const key = item.ledger.trim().toLowerCase();
            if (!mappedLedgersMap.has(key)) {
              mappedLedgersMap.set(key, {
                name: item.ledger,
                majorHead: item.majorHeadCode,
                minorHead: item.minorHeadCode,
                grouping: item.groupingCode
              });
              if (item.ledger.toLowerCase().includes('tcs')) {
                console.log(`[GlobalMap Debug] ADDED ${item.ledger} to map.`);
              }
            }
          }
        }
      }
    }

    // Convert map to array and take top N
    return Array.from(mappedLedgersMap.values()).slice(0, limit);
  }
}
