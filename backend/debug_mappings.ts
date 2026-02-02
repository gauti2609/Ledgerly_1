
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    // Get PrismaService directly
    const prisma = app.get(PrismaService);

    try {
        const entities = await prisma.financialEntity.findMany({
            where: { isSoftDeleted: false },
            orderBy: { updatedAt: 'desc' },
            take: 100
        });

        console.log(`Scanning ${entities.length} entities...`);

        for (const entity of entities) {
            console.log(`\n--- Entity: ${entity.name} (${entity.id}) Updated: ${entity.updatedAt} ---`);
            const data = typeof entity.data === 'string' ? JSON.parse(entity.data) : entity.data;

            if (data.trialBalance) {
                const tcsItems = data.trialBalance.filter((i: any) => i.ledger && i.ledger.toLowerCase().includes('tcs'));
                if (tcsItems.length > 0) {
                    console.log("Found TCS Items:");
                    tcsItems.forEach((item: any) => {
                        console.log(`  - ${item.ledger}: isMapped=${item.isMapped}, Major=${item.majorHeadCode}, Minor=${item.minorHeadCode}, Group=${item.groupingCode}`);
                    });
                } else {
                    console.log("  No TCS items in TB.");
                }
            } else {
                console.log("  No trialBalance data.");
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await app.close();
    }
}
bootstrap();
