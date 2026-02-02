import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async logAction(userId: string, action: string, entityType?: string, entityId?: string, details?: any) {
        return this.prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                details: details ? JSON.stringify(details) : null,
            },
        });
    }

    async getLogs(limit = 50) {
        return this.prisma.auditLog.findMany({
            take: limit,
            orderBy: { timestamp: 'desc' },
            include: {
                user: {
                    select: { email: true, role: true },
                },
            } as any,
        });
    }
}
