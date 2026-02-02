
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Audit Log Master Search ---');

    // Find Ecosoul entities first to get IDs
    const ecosoulEntities = await prisma.financialEntity.findMany({
        where: { name: { contains: 'Ecosoul' } }
    });
    const ecosoulIds = ecosoulEntities.map(e => e.id);
    console.log(`Searching logs for Ecosoul IDs: ${ecosoulIds.join(', ')}`);

    const logs = await prisma.auditLog.findMany({
        where: {
            OR: [
                { entityId: { in: ecosoulIds } },
                { details: { contains: 'masters' } },
                { details: { contains: 'groupings' } }
            ]
        },
        orderBy: { timestamp: 'desc' }
    });

    console.log(`Found ${logs.length} relevant logs.`);
    logs.forEach(l => {
        console.log(`\nLog ID: ${l.id} | Action: ${l.action} | Timestamp: ${l.timestamp} | EntityId: ${l.entityId}`);
        if (l.details && l.details.length > 50) {
            // Check if it's an update with fields
            try {
                const detailsStr = l.details;
                if (detailsStr.includes('"masters"')) {
                    console.log('--- MASTERS UPDATE DETECTED ---');
                    // Sample the details or save to file
                    // console.log(detailsStr.substring(0, 1000)); 
                }
            } catch (e) { }
        }
    });

    // Also look for specific large logs
    const largeLogs = logs.filter(l => l.details && l.details.length > 10000);
    console.log(`\nFound ${largeLogs.length} large logs (potential full data dumps).`);
    if (largeLogs.length > 0) {
        largeLogs.forEach((ll, i) => {
            console.log(`Large Log ${i}: ID ${ll.id}, Length: ${ll.details.length}`);
            // Save to individual files if needed
            // fs.writeFileSync(`large_log_${i}.txt`, ll.details);
        });
    }
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
