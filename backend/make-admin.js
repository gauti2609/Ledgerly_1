const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@test.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('User not found:', email);
        return;
    }

    console.log('Current User:', user);

    if (user.role !== 'ADMIN') {
        const updated = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' },
        });
        console.log('Updated User to ADMIN:', updated);
    } else {
        console.log('User is already ADMIN');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
