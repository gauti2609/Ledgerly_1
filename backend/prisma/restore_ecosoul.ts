
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log('Restoring Ecosoul Data (Pure SQL Mode)...');

    const tenantId = '3301cf09-17a2-43bb-b940-5590ac1ff6ec';
    const entityId = 'e0e8368a-bf09-4979-fc67-4303bbf843bb';
    const email = 'gautam@smbcllp.com';
    const userId = uuidv4();

    const trialBalance = [
        { ledger: "Land", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.10", groupingCode: "A.10.01", amount: 1200000, debit: 1200000, credit: 0 },
        { ledger: "Buildings", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.10", groupingCode: "A.10.02", amount: 2500000, debit: 2500000, credit: 0 },
        { ledger: "Plant & Machinery", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.10", groupingCode: "A.10.03", amount: 1500000, debit: 1500000, credit: 0 },
        { ledger: "Furniture & Fixtures", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.10", groupingCode: "A.10.04", amount: 200000, debit: 200000, credit: 0 },
        { ledger: "Office Equipment", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.10", groupingCode: "A.10.06", amount: 150000, debit: 150000, credit: 0 },
        { ledger: "Laptop", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.30", groupingCode: "A.30.02", amount: 80000, debit: 80000, credit: 0 },
        { ledger: "Mobile", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.30", groupingCode: "A.30.02", amount: 25000, debit: 25000, credit: 0 },
        { ledger: "ICICI BANK-3618", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.120", groupingCode: "A.120.02", amount: 450000, debit: 450000, credit: 0 },
        { ledger: "IndusInd Bank", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.120", groupingCode: "A.120.02", amount: 320000, debit: 320000, credit: 0 },
        { ledger: "Input CGST", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.140", groupingCode: "A.140.01", amount: 54000, debit: 54000, credit: 0 },
        { ledger: "Finished Goods", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.100", groupingCode: "A.100.03", amount: 890000, debit: 890000, credit: 0 },
        { ledger: "Cash on Hand", isMapped: true, majorHeadCode: "A", minorHeadCode: "A.120", groupingCode: "A.120.01", amount: 15000, debit: 15000, credit: 0 },
        { ledger: "Share Capital", isMapped: true, majorHeadCode: "B", minorHeadCode: "B.10", groupingCode: "B.10.01", amount: 1000000, debit: 0, credit: 1000000 },
        { ledger: "Trade Payables", isMapped: true, majorHeadCode: "B", minorHeadCode: "B.80", groupingCode: "B.80.02", amount: 450000, debit: 0, credit: 450000 },
        { ledger: "Sales", isMapped: true, majorHeadCode: "C", minorHeadCode: "C.10", groupingCode: "C.10.01", amount: 5000000, debit: 0, credit: 5000000 },
        { ledger: "Salaries", isMapped: true, majorHeadCode: "C", minorHeadCode: "C.60", groupingCode: "C.60.01", amount: 1200000, debit: 1200000, credit: 0 },
    ];

    const data = {
        trialBalance,
        masters: {},
        entityInfo: {
            name: "Ecosoul Home Private Limited",
            address: "3 Innov... Drive, Mumbai, Maharashtra, India",
            cin: "U74999MH2021PTC368336",
            pan: "AAACE1234F",
            registrationNumber: "368336"
        },
        scheduleData: {}
    };

    const dataStr = JSON.stringify(data);

    try {
        await prisma.$executeRawUnsafe(`
            INSERT INTO "Tenant" (id, name, type, "updatedAt") 
            VALUES ('${tenantId}', 'SMBCL Group', 'CA_FIRM', NOW()) 
            ON CONFLICT (id) DO NOTHING;
        `);

        await prisma.$executeRawUnsafe(`
            INSERT INTO "User" (id, email, password, role, "tenantId", "updatedAt") 
            VALUES ('${userId}', '${email}', '$2b$10$NJCU/9ARCh1oK477Nw6NXmi', 'PLATFORM_ADMIN', '${tenantId}', NOW()) 
            ON CONFLICT (email) DO UPDATE SET "tenantId" = '${tenantId}';
        `);

        // Get actual userId if it already existed
        const actualUser: any = await prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE email = '${email}'`);
        const finalUserId = actualUser[0].id;

        await prisma.$executeRawUnsafe(`
            INSERT INTO "FinancialEntity" (id, name, "entityType", data, "companyCode", "financialYear", "tenantId", "userId", "updatedAt") 
            VALUES ('${entityId}', 'Ecosoul Home Private Limited', 'Company', $1, 'ECOSOUL-001', '2024-2025', '${tenantId}', '${finalUserId}', NOW()) 
            ON CONFLICT (id) DO UPDATE SET data = $1;
        `, dataStr);

        console.log('Ecosoul restored successfully via Raw SQL.');
    } catch (err) {
        console.error('Error during raw restore:', err);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
