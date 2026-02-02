import { Injectable } from '@nestjs/common';

@Injectable()
export class LicenseService {
    private licenseKey: string = 'DEMO-LICENSE-KEY'; // Default demo key

    isValid(): boolean {
        // Mock Validation Logic
        // In production, verify signature or check against a license server
        if (this.licenseKey === 'EXPIRED-KEY') return false;
        return true; // Default true for demo
    }

    getLicenseStatus() {
        const isValid = this.isValid();
        return {
            isValid,
            key: this.licenseKey,
            plan: 'Enterprise',
            expiryDate: new Date('2026-12-31'),
        };
    }

    updateLicense(key: string) {
        this.licenseKey = key;
        return this.getLicenseStatus();
    }
}
