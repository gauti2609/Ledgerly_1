import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class PendingChangesService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        financialEntityId: string;
        userId: string;
        type: string;
        data: any;
    }) {
        return this.prisma.pendingChange.create({
            data: {
                financialEntityId: data.financialEntityId,
                userId: data.userId,
                type: data.type,
                data: JSON.stringify(data.data),
                status: 'PENDING',
            } as any,
        });
    }

    async findAll() {
        return (this.prisma.pendingChange.findMany as any)({
            include: {
                creator: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                reviewer: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findAllByEntity(entityId: string) {
        return this.prisma.pendingChange.findMany({
            where: {
                financialEntityId: entityId,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                reviewer: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async review(id: string, reviewerId: string, status: string) {
        if (status === 'PENDING') {
            throw new BadRequestException('Cannot set status back to PENDING');
        }

        const change = await this.prisma.pendingChange.findUnique({
            where: { id },
        });

        if (!change) {
            throw new NotFoundException(`Pending change with ID ${id} not found`);
        }

        if (change.status !== 'PENDING') {
            throw new BadRequestException('Change has already been reviewed');
        }

        return this.prisma.pendingChange.update({
            where: { id },
            data: {
                status,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
            },
        });
    }
}
