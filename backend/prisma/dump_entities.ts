
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const entities = await prisma.financialEntity.findMany();
    console.log(JSON.stringify(entities, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
