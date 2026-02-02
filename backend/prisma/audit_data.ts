
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Audit ---');

    const counts = {
        tenants: await prisma.tenant.count(),
        users: await prisma.user.count(),
        financialEntities: await prisma.financialEntity.count(),
        pendingChanges: await prisma.pendingChange.count(),
        auditLogs: await prisma.auditLog.count(),
        taxAuditReports: await prisma.taxAuditReport.count(),
        caroReports: await prisma.caroReport.count()
    };

    console.log(JSON.stringify(counts, null, 2));

    if (counts.financialEntities > 0) {
        const sample = await prisma.financialEntity.findMany({ take: 5, select: { id: true, name: true, financialYear: true } });
        console.log('Sample Entities:', JSON.stringify(sample, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
