
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'chakraworty@smbcllp.com';

    try {
        const deletedUser = await prisma.user.delete({
            where: { email },
        });
        console.log(`Successfully deleted user: ${deletedUser.email} (ID: ${deletedUser.id})`);
    } catch (error) {
        console.error(`Error deleting user ${email}:`, error);
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
