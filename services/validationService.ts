import { TrialBalanceItem, Masters, Grouping } from '../types.ts';

// ============================================================================
// VALIDATION RULES ENGINE
// Based on Schedule_III_Layer2_3_Pack.xlsx - Validation Rules
// ============================================================================

export type ValidationSeverity = 'Critical' | 'High' | 'Medium';

export interface ValidationFinding {
    ruleId: string;
    ruleName: string;
    severity: ValidationSeverity;
    message: string;
    affectedLedgers?: string[]; // Ledger IDs
    details?: string;
}

export interface ValidationResult {
    isValid: boolean;
    findings: ValidationFinding[];
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    timestamp: Date;
}

// ============================================================================
// VR-01: Each TB ledger must map to exactly one Grouping (Critical)
// ============================================================================
export function validateMappingIntegrity(
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): ValidationFinding[] {
    const findings: ValidationFinding[] = [];

    // Check for unmapped ledgers
    const unmappedLedgers = trialBalanceData.filter(item => !item.isMapped);
    if (unmappedLedgers.length > 0) {
        findings.push({
            ruleId: 'VR-01a',
            ruleName: 'Unmapped Ledgers',
            severity: 'Critical',
            message: `${unmappedLedgers.length} ledger(s) are not mapped to any grouping`,
            affectedLedgers: unmappedLedgers.map(l => l.id),
            details: unmappedLedgers.slice(0, 5).map(l => l.ledger).join(', ') +
                (unmappedLedgers.length > 5 ? ` and ${unmappedLedgers.length - 5} more...` : '')
        });
    }

    // Check for invalid grouping codes (mapped to non-existent grouping)
    const validGroupingCodes = new Set(masters.groupings.map(g => g.code));
    const invalidMappings = trialBalanceData.filter(
        item => item.isMapped && item.groupingCode && !validGroupingCodes.has(item.groupingCode)
    );

    if (invalidMappings.length > 0) {
        findings.push({
            ruleId: 'VR-01b',
            ruleName: 'Invalid Grouping Codes',
            severity: 'Critical',
            message: `${invalidMappings.length} ledger(s) mapped to non-existent grouping codes`,
            affectedLedgers: invalidMappings.map(l => l.id),
            details: invalidMappings.slice(0, 5).map(l => `${l.ledger} → ${l.groupingCode}`).join(', ')
        });
    }

    return findings;
}

// ============================================================================
// VR-02: Total Assets must equal Equity & Liabilities (Critical)
// ============================================================================
export function validateBalanceSheetEquation(
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): ValidationFinding[] {
    const findings: ValidationFinding[] = [];

    // Calculate totals by Major Head
    const assetMinorCodes = masters.minorHeads
        .filter(m => m.majorHeadCode === 'A')
        .map(m => m.code);

    const liabilityMinorCodes = masters.minorHeads
        .filter(m => m.majorHeadCode === 'B')
        .map(m => m.code);

    // Calculate P&L Surplus/Deficit
    // Revenue (Credit) - Expenses (Debit)
    // In our system, Credit is likely negative or positive? 
    // Standard convention in DB: Assets/Expenses = Positive, Liab/Income = Negative?
    // Wait, let's check balance logic.
    // Usually:
    // Assets (Dr) = +ve
    // Liabilities (Cr) = -ve
    // Expenses (Dr) = +ve
    // Income (Cr) = -ve
    // Net Profit = Sum(Income + Expenses) -> If Income is -100 and Expense is +80, Sum is -20 (Profit).
    // This -20 (Credit) adds to Equity (-ve).
    // So simply Sum(All Items) should be 0.
    // The current validation compares Abs(Assets) vs Abs(Liabilities).
    // This implies it expects them to be equal in magnitude.
    // Assets = 209M (+ve)
    // Liabilities = -280M (-ve) -> Abs is 280M.
    // Diff is usage. 
    // Let's explicitly calculate P&L.

    const incomeMinorCodes = masters.minorHeads
        .filter(m => m.majorHeadCode === 'C' && (m.code.startsWith('C.10') || m.code.startsWith('C.20')))
        .map(m => m.code);

    const expenseMinorCodes = masters.minorHeads
        .filter(m => m.majorHeadCode === 'C' && !m.code.startsWith('C.10') && !m.code.startsWith('C.20'))
        .map(m => m.code);

    let totalAssets = 0;
    let totalLiabilities = 0; // Equity & Liabilities
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const item of trialBalanceData) {
        if (!item.isMapped || !item.minorHeadCode) continue;

        if (assetMinorCodes.includes(item.minorHeadCode)) {
            totalAssets += item.closingCy;
        } else if (liabilityMinorCodes.includes(item.minorHeadCode)) {
            totalLiabilities += item.closingCy;
        } else if (incomeMinorCodes.includes(item.minorHeadCode)) {
            totalIncome += item.closingCy;
        } else if (expenseMinorCodes.includes(item.minorHeadCode)) {
            totalExpenses += item.closingCy;
        }
    }

    // Net Profit calculation
    // Assuming standard sign convention: Income is negative (Credit), Expense is positive (Debit).
    // Net Result = Income + Expense. 
    // Example: Income -100, Expense 80. Result -20 (Profit).
    // This -20 should increase the Liability side (which is negative).
    // So Effective Liabilities = Existing Liabilities + Net Result.
    // Example: Liab -80. + (-20) = -100. Matches Assets +100.

    // However, the previous code compared Magnitude: Abs(Assets) vs Abs(Liabilities).
    // Assets (209M) vs Liab (280M).
    // If we assume Liab includes Retained Earnings from previous years (which it should),
    // then we just need to add CURRENT YEAR P&L.

    const currentYearPnL = totalIncome + totalExpenses;
    const adjustedLiabilities = totalLiabilities + currentYearPnL;

    // Now compare Assets (+ve) vs Adjusted Liabilities (-ve).
    // They should sum to 0.
    const difference = Math.abs(totalAssets + adjustedLiabilities);

    // Check if they balance (with small tolerance for rounding)
    // const difference = Math.abs(totalAssets - totalLiabilities); // Removed old calculation
    const tolerance = 1; // Allow ₹1 difference for rounding

    if (difference > tolerance) {
        findings.push({
            ruleId: 'VR-02',
            ruleName: 'Balance Sheet Mismatch',
            severity: 'Critical',
            message: `Balance Sheet does not tally. Assets: ${totalAssets.toLocaleString()}, Equity & Liabilities (Adj): ${Math.abs(adjustedLiabilities).toLocaleString()}, Diff: ${difference.toLocaleString()}`,
            details: `Assets: ${totalAssets.toLocaleString()} | Liabilities: ${Math.abs(totalLiabilities).toLocaleString()} | Current Year P&L: ${Math.abs(currentYearPnL).toLocaleString()} (${currentYearPnL < 0 ? 'Profit' : 'Loss'})`
        });
    }

    return findings;
}

// ============================================================================
// VR-05: Current maturities must not remain under long-term borrowings (High)
// ============================================================================
export function validateBorrowingsClassification(
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): ValidationFinding[] {
    const findings: ValidationFinding[] = [];

    // Find ledgers mapped to long-term borrowings that might be current maturities
    const longTermBorrowingsCode = 'B.30'; // Long-Term Borrowings minor head
    const currentMaturityKeywords = ['current maturity', 'current portion', 'due within', 'payable within'];

    const suspectLedgers = trialBalanceData.filter(item => {
        if (!item.isMapped || !item.minorHeadCode) return false;
        if (item.minorHeadCode !== longTermBorrowingsCode) return false;

        const ledgerLower = item.ledger.toLowerCase();
        return currentMaturityKeywords.some(kw => ledgerLower.includes(kw));
    });

    if (suspectLedgers.length > 0) {
        findings.push({
            ruleId: 'VR-05',
            ruleName: 'Current Maturity Misclassification',
            severity: 'High',
            message: `${suspectLedgers.length} ledger(s) appear to be current maturities but are classified under Long-Term Borrowings`,
            affectedLedgers: suspectLedgers.map(l => l.id),
            details: suspectLedgers.map(l => l.ledger).join(', ')
        });
    }

    return findings;
}

// ============================================================================
// VR-06: Depreciation must not appear under Other Expenses (Medium)
// ============================================================================
export function validateDepreciationClassification(
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): ValidationFinding[] {
    const findings: ValidationFinding[] = [];

    // Find depreciation ledgers mapped to Other Expenses
    const otherExpensesCode = 'C.90'; // Other Expenses minor head
    const depreciationKeywords = ['depreciation', 'amortisation', 'amortization'];

    const misclassifiedDep = trialBalanceData.filter(item => {
        if (!item.isMapped || !item.minorHeadCode) return false;
        if (item.minorHeadCode !== otherExpensesCode) return false;

        const ledgerLower = item.ledger.toLowerCase();
        return depreciationKeywords.some(kw => ledgerLower.includes(kw));
    });

    if (misclassifiedDep.length > 0) {
        findings.push({
            ruleId: 'VR-06',
            ruleName: 'Depreciation Misclassification',
            severity: 'Medium',
            message: `${misclassifiedDep.length} depreciation ledger(s) are classified under Other Expenses instead of Depreciation & Amortisation`,
            affectedLedgers: misclassifiedDep.map(l => l.id),
            details: misclassifiedDep.map(l => l.ledger).join(', ')
        });
    }

    return findings;
}

// ============================================================================
// VR-03: MSME ageing disclosure mandatory if MSME payables exist (High)
// ============================================================================
export function validateMSMEDisclosure(
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): ValidationFinding[] {
    const findings: ValidationFinding[] = [];

    // Check if any ledgers are mapped to MSME Trade Payables
    const msmePayablesCode = 'B.80.01'; // Trade Payables – MSME grouping
    const msmePayables = trialBalanceData.filter(
        item => item.isMapped && item.groupingCode === msmePayablesCode && item.closingCy !== 0
    );

    if (msmePayables.length > 0) {
        const totalMSME = msmePayables.reduce((sum, item) => sum + item.closingCy, 0);
        findings.push({
            ruleId: 'VR-03',
            ruleName: 'MSME Disclosure Required',
            severity: 'High',
            message: `MSME payables exist (₹${totalMSME.toLocaleString()}). Ensure MSME ageing disclosure is completed in Notes.`,
            details: `${msmePayables.length} ledger(s) mapped to MSME payables`
        });
    }

    return findings;
}

// ============================================================================
// VR-04: Trade Receivables Ageing Reconciliation (High)
// ============================================================================
export function validateReceivablesAgeing(
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): ValidationFinding[] {
    const findings: ValidationFinding[] = [];

    // Check if trade receivables exist
    const receivablesMinorCode = 'A.110'; // Trade Receivables minor head
    const receivables = trialBalanceData.filter(
        item => item.isMapped && item.minorHeadCode === receivablesMinorCode && item.closingCy !== 0
    );

    if (receivables.length > 0) {
        const totalReceivables = receivables.reduce((sum, item) => sum + item.closingCy, 0);
        findings.push({
            ruleId: 'VR-04',
            ruleName: 'Receivables Ageing Required',
            severity: 'High',
            message: `Trade Receivables exist (₹${totalReceivables.toLocaleString()}). Ensure ageing schedule is completed in Notes.`,
            details: `${receivables.length} ledger(s) mapped to Trade Receivables`
        });
    }

    return findings;
}

// ============================================================================
// MAIN VALIDATION RUNNER
// ============================================================================
export function runAllValidations(
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): ValidationResult {
    const allFindings: ValidationFinding[] = [];

    // Run all validation rules
    allFindings.push(...validateMappingIntegrity(trialBalanceData, masters));
    allFindings.push(...validateBalanceSheetEquation(trialBalanceData, masters));
    allFindings.push(...validateBorrowingsClassification(trialBalanceData, masters));
    allFindings.push(...validateDepreciationClassification(trialBalanceData, masters));
    allFindings.push(...validateMSMEDisclosure(trialBalanceData, masters));
    allFindings.push(...validateReceivablesAgeing(trialBalanceData, masters));

    // Count by severity
    const criticalCount = allFindings.filter(f => f.severity === 'Critical').length;
    const highCount = allFindings.filter(f => f.severity === 'High').length;
    const mediumCount = allFindings.filter(f => f.severity === 'Medium').length;

    return {
        isValid: criticalCount === 0,
        findings: allFindings,
        criticalCount,
        highCount,
        mediumCount,
        timestamp: new Date()
    };
}

// ============================================================================
// HELPER: Get severity color for UI
// ============================================================================
export function getSeverityColor(severity: ValidationSeverity): string {
    switch (severity) {
        case 'Critical': return 'text-red-500';
        case 'High': return 'text-orange-500';
        case 'Medium': return 'text-yellow-500';
        default: return 'text-gray-500';
    }
}

export function getSeverityBgColor(severity: ValidationSeverity): string {
    switch (severity) {
        case 'Critical': return 'bg-red-500/20 border-red-500';
        case 'High': return 'bg-orange-500/20 border-orange-500';
        case 'Medium': return 'bg-yellow-500/20 border-yellow-500';
        default: return 'bg-gray-500/20 border-gray-500';
    }
}
