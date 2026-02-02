import { Controller, Get, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { LicenseService } from './license.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';


@Controller('license')
export class LicenseController {
    constructor(private readonly licenseService: LicenseService) { }

    @Get('status')
    getStatus() {
        return this.licenseService.getLicenseStatus();
    }

    @Post('update')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    updateLicense(@Body() body: { key: string }) {
        if (!body.key) throw new HttpException('Key is required', HttpStatus.BAD_REQUEST);
        return this.licenseService.updateLicense(body.key);
    }
}
