
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Deleting entities containing "Test" in their name...');
    const result = await prisma.financialEntity.deleteMany({
        where: {
            name: {
                contains: 'Test',
            },
        },
    });
    console.log(`Deleted ${result.count} test entities.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
