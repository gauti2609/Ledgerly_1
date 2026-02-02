
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    const email = 'gautam@smbcllp.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating user: ${email}...`);

    // First handle tenant
    let tenant = await prisma.tenant.findFirst({
        where: { name: 'SMBCL Group' }
    });

    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                id: uuidv4(),
                name: 'SMBCL Group',
                type: 'CA_FIRM',
                updatedAt: new Date()
            }
        });
        console.log(`Created default tenant: ${tenant.id}`);
    } else {
        console.log(`Using existing tenant: ${tenant.id}`);
    }

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'PLATFORM_ADMIN',
            tenantId: tenant.id,
            updatedAt: new Date()
        },
        create: {
            id: uuidv4(),
            email,
            password: hashedPassword,
            role: 'PLATFORM_ADMIN',
            tenantId: tenant.id,
            updatedAt: new Date()
        }
    });

    console.log(`User ${user.email} created/updated successfully.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
