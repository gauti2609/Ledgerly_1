
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const keywords = ['Agitator', 'Turbo', 'Biometric', 'Cooler', 'Microwave'];
    for (const k of keywords) {
        const logs = await prisma.auditLog.findMany({
            where: { details: { contains: k } }
        });
        console.log(`Keyword: ${k} | Logs: ${logs.length}`);
        logs.forEach(l => console.log(`  Log ID: ${l.id} | Action: ${l.action}`));
    }
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
