import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles('PLATFORM_ADMIN', 'TENANT_ADMIN')
    async findAll(@Request() req) {
        if (req.user.role === 'PLATFORM_ADMIN') {
            // Platform Admin sees everyone in the tenant (or potentially all tenants if we relaxed the check)
            return this.usersService.findAll(req.user.tenantId);
        }
        // Tenant Admins cannot see Platform Admins
        return this.usersService.findAll(req.user.tenantId, 'PLATFORM_ADMIN');
    }

    @Post()
    @Roles('PLATFORM_ADMIN', 'TENANT_ADMIN')
    async create(@Request() req, @Body() createUserDto: { email: string; password: string; role: string; entityId?: string }) {
        if (!req.user.tenantId && req.user.role !== 'PLATFORM_ADMIN') {
            throw new ForbiddenException('Tenant context required');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        return this.usersService.create(
            createUserDto.email,
            hashedPassword,
            req.user.tenantId,
            createUserDto.role,
            createUserDto.entityId
        );
    }

    @Put(':id')
    @Roles('PLATFORM_ADMIN', 'TENANT_ADMIN')
    async update(@Request() req, @Param('id') id: string, @Body() updateUserDto: any) {
        // Ideally verify user belongs to tenant first
        // For now simplistic implementation
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @Roles('PLATFORM_ADMIN', 'TENANT_ADMIN')
    async remove(@Request() req, @Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
