
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'file:./dev.db'
        }
    }
});

async function main() {
    try {
        const entities = await prisma.financialEntity.findMany();
        console.log('Entities in SQLite:', entities.map(e => e.name));
    } catch (e) {
        console.error('Failed to read SQLite:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
