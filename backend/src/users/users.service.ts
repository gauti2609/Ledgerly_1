import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findAll(tenantId: string, excludeRole?: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        ...(excludeRole ? { role: { not: excludeRole as any } } : {})
      },
      select: {
        id: true,
        email: true,
        role: true,
        entityId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(email: string, password: string, tenantId?: string, role: any = 'VIEWER', entityId?: string) {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    return this.prisma.user.create({
      data: {
        email,
        password,
        tenantId,
        role,
        entityId
      } as any,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
