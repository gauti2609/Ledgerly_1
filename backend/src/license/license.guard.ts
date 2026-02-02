import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { LicenseService } from './license.service';

@Injectable()
export class LicenseGuard implements CanActivate {
    constructor(private licenseService: LicenseService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const path = request.path;

        // Allow public routes and license update routes
        if (path.includes('/auth') || path.includes('/license')) {
            return true;
        }

        if (!this.licenseService.isValid()) {
            throw new HttpException('License Expired or Invalid', HttpStatus.PAYMENT_REQUIRED);
        }

        return true;
    }
}
