import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FinancialEntityModule } from './financial-entity/financial-entity.module';
import { AiModule } from './ai/ai.module';
import { AuditModule } from './audit/audit.module';
import { ReportModule } from './report/report.module';
import { MastersModule } from './masters/masters.module';
import { PendingChangesModule } from './pending-changes/pending-changes.module';
import { ValidationModule } from './validation/validation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'dist'),
      exclude: ['/api/(.*)'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    FinancialEntityModule,
    AiModule,
    AuditModule,
    ReportModule,
    MastersModule,
    PendingChangesModule,
    ValidationModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
