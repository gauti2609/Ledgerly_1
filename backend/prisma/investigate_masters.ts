
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Investigation Scan ---');

    // 1. Check soft deleted Ecosoul
    const softDeleted = await prisma.financialEntity.findMany({
        where: { name: { contains: 'Ecosoul' }, isSoftDeleted: true }
    });
    console.log(`Found ${softDeleted.length} soft deleted Ecosoul entities.`);
    softDeleted.forEach(e => {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        const groupingsCount = data?.masters?.groupings?.length || 0;
        console.log(`ID: ${e.id} | Groupings: ${groupingsCount} | DeletedAt: ${e.deletedAt}`);
        if (groupingsCount > 100) {
            console.log('--- EXTENSIVE MASTERS FOUND IN SOFT DELETED ENTITY ---');
            console.log(JSON.stringify(data.masters, null, 2));
        }
    });

    // 2. Check Audit Logs for master updates
    const masterLogs = await prisma.auditLog.findMany({
        where: { details: { contains: 'masters' } },
        orderBy: { timestamp: 'desc' },
        take: 5
    });
    console.log(`\nFound ${masterLogs.length} audit logs mentioning masters.`);
    masterLogs.forEach(l => {
        console.log(`Log ID: ${l.id} | Action: ${l.action} | Timestamp: ${l.timestamp}`);
        // console.log(l.details); // Truncated for safety, but check if it contains the full data
    });
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
