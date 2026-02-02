import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst();
    if (user) {
        console.log(`Found user: ${user.email}`);
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'TENANT_ADMIN' }
        });
        console.log(`Updated user ${updated.email} to TENANT_ADMIN`);
    } else {
        console.log('No users found. Creating one...');
        const newUser = await prisma.user.create({
            data: {
                email: 'admin@finautomate.com',
                password: '$2b$10$EpIx.0.f.f.f.f.f.f.f.f.f.f.f.f', // Dummy hash
                role: 'TENANT_ADMIN'
            }
        });
        console.log(`Created user ${newUser.email} as TENANT_ADMIN`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
