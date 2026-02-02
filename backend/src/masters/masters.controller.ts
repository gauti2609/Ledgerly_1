import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { MastersService, Masters } from './masters.service';

@Controller('masters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MastersController {
    constructor(private readonly mastersService: MastersService) { }

    /**
     * Sync all entities to the updated Standard groupings structure.
     * This replaces the masters data for all entities belonging to the user.
     */
    @Post('sync')
    @Roles('ADMIN', 'EDITOR', 'VIEWER')
    async syncMasters(@Request() req) {
        const result = await this.mastersService.syncMastersForAllEntities(req.user.userId);
        return {
            message: `Masters synced successfully (Standard groupings)`,
            entitiesUpdated: result.entitiesUpdated
        };
    }

    /**
     * Get the default masters data structure.
     */
    @Get('default')
    @Roles('ADMIN', 'EDITOR', 'VIEWER')
    getDefaultMasters() {
        return this.mastersService.getDefaultMasters();
    }

    /**
     * Add a new grouping to global masters.
     * This will update all entities belonging to the user with the new grouping.
     */
    @Post('add-grouping')
    @Roles('ADMIN', 'EDITOR')
    async addGrouping(
        @Request() req,
        @Body() grouping: { code: string; name: string; minorHeadCode: string },
    ) {
        await this.mastersService.addGroupingToAllEntities(req.user.userId, grouping);
        return { message: 'Grouping added to global masters', grouping };
    }
}

