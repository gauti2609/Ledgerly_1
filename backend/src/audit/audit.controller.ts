import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
    constructor(private auditService: AuditService) { }

    @Get()
    @Roles('ADMIN')
    async getLogs(@Query('limit') limit: string) {
        return this.auditService.getLogs(limit ? parseInt(limit) : 50);
    }
}
