import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Request } from '@nestjs/common';
import { FinancialEntityService } from './financial-entity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';


import { AuditService } from '../audit/audit.service';

@Controller('entities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialEntityController {
  constructor(
    private readonly financialEntityService: FinancialEntityService,
    private readonly auditService: AuditService,
  ) { }

  @Post()
  @Roles('PLATFORM_ADMIN', 'TENANT_ADMIN') // Only Tenant Admins can create entities
  async create(@Request() req, @Body() createDto: { name: string; entityType: string; financialYear: string; confirmNew?: boolean; linkToCode?: string }) {
    // Check if user has tenantId if not Platform Admin
    if (req.user.role !== 'PLATFORM_ADMIN' && !req.user.tenantId) {
      // This should be caught by Service, but good to have here or via Guard
    }
    const result = await this.financialEntityService.create(req.user, createDto.name, createDto.entityType, createDto.financialYear, createDto.confirmNew, createDto.linkToCode);

    // If result has status, it's a check response
    if ('status' in result && result.status === 'POSSIBLE_MATCHES') {
      return result; // Return 200 with matches
    }

    // Otherwise it's the entity
    const entity = result as any;
    await this.auditService.logAction(req.user.userId, 'CREATE_ENTITY', 'FinancialEntity', entity.id, { name: createDto.name, type: createDto.entityType });
    return entity;
  }

  @Get()
  findAll(@Request() req) {
    return this.financialEntityService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.financialEntityService.findOne(id, req.user);
  }

  @Put(':id')
  // Roles allowed: Tenant Admin (all), Entity Admin & Manager (their own)
  // Roles allowed: Tenant Admin (all), Entity Admin & Manager (their own)
  @Roles('PLATFORM_ADMIN', 'TENANT_ADMIN', 'ENTITY_ADMIN', 'MANAGER')
  async update(@Request() req, @Param('id') id: string, @Body() data: any) {
    const entity = await this.financialEntityService.update(id, req.user, data);
    await this.auditService.logAction(req.user.userId, 'UPDATE_ENTITY', 'FinancialEntity', id, { updatedFields: Object.keys(data) });
    return entity;
  }

  @Delete(':id')
  // Roles allowed: Tenant Admin (Soft Delete), Entity Admin (Soft Delete)
  // Roles allowed: Tenant Admin (Soft Delete), Entity Admin (Soft Delete)
  @Roles('PLATFORM_ADMIN', 'TENANT_ADMIN', 'ENTITY_ADMIN')
  async remove(@Request() req, @Param('id') id: string) {
    await this.financialEntityService.remove(id, req.user);
    await this.auditService.logAction(req.user.userId, 'DELETE_ENTITY', 'FinancialEntity', id);
    return { message: 'Entity deleted successfully' };
  }
}
