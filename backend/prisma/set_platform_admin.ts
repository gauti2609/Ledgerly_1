import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'gautam@smbcllp.com';

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error(`User ${email} not found.`);
        process.exit(1);
    }

    console.log(`Promoting ${email} (current role: ${user.role}) to PLATFORM_ADMIN...`);

    const updatedUser = await prisma.user.update({
        where: { email },
        data: {
            role: 'PLATFORM_ADMIN',
            // Platform Admin might not strictly need a tenantId, but usually in this system they belong to the 'FinAutomate' tenant or similar. 
            // For now, we leave the tenantId as is (likely the CA Firm tenant) so they can still see tenant data, 
            // OR we might need to clear it if Platform Admin implies "All Tenants".
            // Based on previous controller logic:
            // if (req.user.role === 'PLATFORM_ADMIN') return usersService.findAll(req.user.tenantId); 
            // It seems Platform Admin logic in UsersController still filters by tenantId if present?
            // "if (req.user.role === 'PLATFORM_ADMIN') { ... return this.usersService.findAll(req.user.tenantId); }"
            // Actually line 17 of UsersController says:
            // "if (req.user.role === 'PLATFORM_ADMIN') { ... return this.usersService.findAll(req.user.tenantId); }"
            // This suggests Platform Admin is treated as a Super User *within* a context, or my verification logic was tenant-scoped.
            // But usually Platform Admin should see EVERYTHING.
            // Let's just update the role for now.
        },
    });

    console.log(`User ${email} is now ${updatedUser.role}.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
