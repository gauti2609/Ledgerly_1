import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
    constructor(private prisma: PrismaService) { }

    async getCaroReport(entityId: string) {
        // Find existing or return empty structure
        const report = await this.prisma.caroReport.findUnique({
            where: { financialEntityId: entityId },
        });
        if (report && typeof report.clauseData === 'string') {
            return { ...report, clauseData: JSON.parse(report.clauseData) };
        }
        return report || { financialEntityId: entityId, clauseData: {} };
    }

    async upsertCaroReport(entityId: string, clauseData: any) {
        return this.prisma.caroReport.upsert({
            where: { financialEntityId: entityId },
            update: { clauseData: JSON.stringify(clauseData) },
            create: {
                financialEntityId: entityId,
                clauseData: JSON.stringify(clauseData),
            } as any,
        });
    }
}
