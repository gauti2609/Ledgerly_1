import { Module } from '@nestjs/common';
import { PendingChangesController } from './pending-changes.controller';
import { PendingChangesService } from './pending-changes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PendingChangesController],
    providers: [PendingChangesService],
    exports: [PendingChangesService],
})
export class PendingChangesModule { }
