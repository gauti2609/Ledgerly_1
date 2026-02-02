import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { PendingChangesService } from './pending-changes.service';
// Assuming you have an AuthGuard, if not we might need to skip or implement a basic one. 
// Based on file list, there is an auth module.
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

// For now, I will assume typical Guard usage but if it fails I will check AuthModule
// Checking app.module imports... AuthModule is there.

@Controller('pending-changes')
export class PendingChangesController {
    constructor(private readonly pendingChangesService: PendingChangesService) { }

    @Post()
    async create(@Body() createDto: { financialEntityId: string; userId: string; type: string; data: any }) {
        return this.pendingChangesService.create(createDto);
    }

    @Get()
    async findAll() {
        return this.pendingChangesService.findAll();
    }

    @Get(':entityId')
    async findAllByEntity(@Param('entityId') entityId: string) {
        return this.pendingChangesService.findAllByEntity(entityId);
    }

    @Patch(':id/review')
    async review(
        @Param('id') id: string,
        @Body() reviewDto: { reviewerId: string; status: 'APPROVED' | 'REJECTED' }
    ) {
        // Basic validation
        if (!['APPROVED', 'REJECTED'].includes(reviewDto.status)) {
            throw new BadRequestException('Status must be APPROVED or REJECTED');
        }
        return this.pendingChangesService.review(id, reviewDto.reviewerId, reviewDto.status);
    }
}
