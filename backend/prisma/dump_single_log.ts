
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const logId = '8235587e-1d45-47ea-8614-4b667378745a';
    const log = await prisma.auditLog.findUnique({
        where: { id: logId }
    });

    if (log && log.details) {
        fs.writeFileSync('audit_log_details.json', log.details);
        console.log(`Successfully dumped details of log ${logId} to audit_log_details.json`);
    } else {
        console.log(`Log ${logId} not found or has no details.`);
    }
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
