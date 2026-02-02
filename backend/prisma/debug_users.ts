
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'gautam@smbcllp.com';
    const targetEmail = 'chakraworty@smbcllp.com';

    const admin = await prisma.user.findFirst({ where: { email: adminEmail } });
    const target = await prisma.user.findFirst({ where: { email: targetEmail } });

    console.log('--- Admin Details ---');
    if (admin) {
        console.log(`ID: ${admin.id}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Role: ${admin.role}`);
        console.log(`TenantID: ${admin.tenantId}`);
    } else {
        console.log('Admin not found');
    }

    console.log('\n--- Target User Details ---');
    if (target) {
        console.log(`ID: ${target.id}`);
        console.log(`Email: ${target.email}`);
        console.log(`Role: ${target.role}`);
        console.log(`TenantID: ${target.tenantId}`);
    } else {
        console.log('Target user not found');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
