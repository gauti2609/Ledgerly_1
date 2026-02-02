
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidationService {
    validateFinancialData(data: any) {
        if (!data || !data.trialBalanceData || !Array.isArray(data.trialBalanceData)) {
            // If partial update or no TB, skip or warn? 
            // For now, if TB is present, validate it.
            return;
        }

        const tb = data.trialBalanceData;
        const tolerance = 1.0; // Allow small float diff

        // Fundamental Check: Sum of all ledgers (Debits - Credits) must be 0
        // Provided the data strictly follows Debit (+), Credit (-) convention.
        // If the data is all positive strings, this fails.
        // We know from frontend logic that it uses Math.abs, implying signs exist.

        const totalCy = tb.reduce((sum: number, item: any) => sum + (Number(item.closingCy) || 0), 0);

        // Also check PY consistency? Optional.

        if (Math.abs(totalCy) > tolerance) {
            // Fallback: maybe the convention is Assets = Types.
            // Let's rely on the user manual which said "Assets = Liabilities check".
            // If Sum != 0, it means it's unbalanced.
            throw new BadRequestException(`Trial Balance is not balanced. Difference: ${totalCy.toFixed(2)}`);
        }
    }
}
