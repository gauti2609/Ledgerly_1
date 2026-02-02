import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'gautam@smbcllp.com';
    let user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
        user = await prisma.user.findFirst(); // Fallback to first user
    }

    if (user) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });
        console.log(`Updated password for ${user.email} to 'password123'`);
    } else {
        console.error('No user found to update');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
