import { Module } from '@nestjs/common';
import { FinancialEntityService } from './financial-entity.service';
import { FinancialEntityController } from './financial-entity.controller';
import { ValidationModule } from '../validation/validation.module';

@Module({
  imports: [ValidationModule],
  controllers: [FinancialEntityController],
  providers: [FinancialEntityService],
  exports: [FinancialEntityService], // Export so AiModule can use it
})
export class FinancialEntityModule { }
