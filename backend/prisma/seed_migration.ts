import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration seed...');

    // 1. Create Default Tenant
    const defaultTenantName = 'FinAutomate Default';
    let tenant = await prisma.tenant.findFirst({
        where: { name: defaultTenantName },
    });

    if (!tenant) {
        console.log('Creating default tenant...');
        tenant = await prisma.tenant.create({
            data: {
                name: defaultTenantName,
                type: 'CA_FIRM', // Or OTHER, depending on preference. CA_FIRM fits best for "FinAutomate" context usually? Or maybe "OTHER" for Platform Admin?
                // Let's use CA_FIRM as the default container for now.
            },
        });
        console.log(`Created tenant: ${tenant.id}`);
    } else {
        console.log(`Using existing tenant: ${tenant.id}`);
    }

    // 2. Migrate Users
    const usersWithoutTenant = await prisma.user.findMany({
        where: { tenantId: null },
    });

    console.log(`Found ${usersWithoutTenant.length} users to migrate.`);
    for (const user of usersWithoutTenant) {
        await prisma.user.update({
            where: { id: user.id },
            data: { tenantId: tenant.id },
        });
    }

    // 3. Migrate Entities
    const entitiesWithoutTenant = await prisma.financialEntity.findMany({
        where: { tenantId: null },
    });

    console.log(`Found ${entitiesWithoutTenant.length} entities to migrate.`);
    for (const entity of entitiesWithoutTenant) {
        await prisma.financialEntity.update({
            where: { id: entity.id },
            data: { tenantId: tenant.id },
        });
    }

    console.log('Migration seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
