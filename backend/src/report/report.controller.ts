import { Controller, Get, Post, Body, Param, UseGuards, Put } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    @Get('caro/:entityId')
    async getCaroReport(@Param('entityId') entityId: string) {
        return this.reportService.getCaroReport(entityId);
    }

    @Post('caro/:entityId')
    async upsertCaroReport(
        @Param('entityId') entityId: string,
        @Body() body: { clauseData: any }
    ) {
        return this.reportService.upsertCaroReport(entityId, body.clauseData);
    }
}
