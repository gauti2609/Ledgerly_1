import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { FinancialEntityModule } from '../financial-entity/financial-entity.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [FinancialEntityModule, AuditModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule { }
