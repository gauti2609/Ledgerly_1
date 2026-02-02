
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.auditLog.findMany({
        where: { details: { contains: 'masters' } }
    });

    let maxLen = 0;
    let bestLog = null;

    logs.forEach(l => {
        if (l.details && l.details.length > maxLen) {
            maxLen = l.details.length;
            bestLog = l;
        }
    });

    if (bestLog) {
        console.log(`Best Log Found: ID ${bestLog.id}, Length: ${bestLog.details.length}, Action: ${bestLog.action}`);
        fs.writeFileSync('best_audit_masters.json', bestLog.details);
    } else {
        console.log('No logs with masters found.');
    }
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
