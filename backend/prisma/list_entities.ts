
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const entities = await prisma.financialEntity.findMany();
    console.log('--- Financial Entities ---');
    entities.forEach(e => {
        console.log(`ID: ${e.id} | Name: ${e.name} | TenantID: ${e.tenantId}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
