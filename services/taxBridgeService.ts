import { TrialBalanceItem, Masters, LedgerAttributes } from '../types.ts';

// ============================================================================
// BOOK TO TAX BRIDGE SERVICE
// Reconciles Accounting Profit to Taxable Income as per Income Tax Act
// ============================================================================

export type AdjustmentType = 'DISALLOWANCE' | 'EXEMPT' | 'DEEMED_INCOME' | 'DEDUCTION' | 'DEPRECIATION';
export type AdjustmentDirection = 'ADD' | 'LESS';

export interface TaxAdjustment {
    id: string;
    section: string;
    description: string;
    adjustmentType: AdjustmentType;
    direction: AdjustmentDirection;
    amountCY: number;
    amountPY: number;
    triggerGroupings: string[];
    triggerAttributes: (keyof LedgerAttributes)[];
    autoCalculationBasis: string;
    isManual?: boolean;
}

export interface TaxBridgeResult {
    bookProfit: number;
    bookProfitPY: number;
    adjustments: TaxAdjustment[];
    totalAdditions: number;
    totalAdditionsPY: number;
    totalDeductions: number;
    totalDeductionsPY: number;
    taxableIncome: number;
    taxableIncomePY: number;
}

// ============================================================================
// ADJUSTMENT DEFINITIONS
// ============================================================================
const ADJUSTMENT_TEMPLATES: Omit<TaxAdjustment, 'amountCY' | 'amountPY'>[] = [
    // === ADDITIONS (Disallowances) ===
    {
        id: 'ADJ-01',
        section: 'Sec 40(a)(ia)',
        description: 'TDS not deducted/deposited - Disallowance',
        adjustmentType: 'DISALLOWANCE',
        direction: 'ADD',
        triggerGroupings: ['C.90.01', 'C.90.02', 'C.90.03', 'C.90.04', 'C.90.05'],
        triggerAttributes: [],
        autoCalculationBasis: 'Manual entry required - based on 3CD Clause 34'
    },
    {
        id: 'ADJ-02',
        section: 'Sec 40A(3)',
        description: 'Cash payments exceeding ₹10,000',
        adjustmentType: 'DISALLOWANCE',
        direction: 'ADD',
        triggerGroupings: [],
        triggerAttributes: [],
        autoCalculationBasis: 'Manual entry required - based on cash payment register'
    },
    {
        id: 'ADJ-03',
        section: 'Sec 43B',
        description: 'Statutory dues unpaid as on due date',
        adjustmentType: 'DISALLOWANCE',
        direction: 'ADD',
        triggerGroupings: ['B.90.01', 'B.90.02', 'B.90.03'],
        triggerAttributes: [],
        autoCalculationBasis: 'Outstanding statutory dues at year end'
    },
    {
        id: 'ADJ-04',
        section: 'Sec 37',
        description: 'Personal/Non-business expenses',
        adjustmentType: 'DISALLOWANCE',
        direction: 'ADD',
        triggerGroupings: ['C.90.12'], // Other Expenses (Misc)
        triggerAttributes: [],
        autoCalculationBasis: 'Manual review of Other Expenses'
    },
    {
        id: 'ADJ-05',
        section: 'MSME Act',
        description: 'Interest on MSME delayed payments (Sec 23)',
        adjustmentType: 'DISALLOWANCE',
        direction: 'ADD',
        triggerGroupings: ['B.80.01'],
        triggerAttributes: ['isMSME'],
        autoCalculationBasis: 'Interest @ 15% p.a. on MSME overdue'
    },
    {
        id: 'ADJ-06',
        section: 'Sec 14A',
        description: 'Expenses related to exempt income',
        adjustmentType: 'DISALLOWANCE',
        direction: 'ADD',
        triggerGroupings: ['C.20.02'], // Dividend Income
        triggerAttributes: [],
        autoCalculationBasis: '1% of average investments or actual, whichever is lower'
    },

    // === Book Depreciation vs Tax Depreciation ===
    {
        id: 'ADJ-07',
        section: 'Sec 32',
        description: 'Add Back: Book Depreciation',
        adjustmentType: 'DEPRECIATION',
        direction: 'ADD',
        triggerGroupings: ['C.50.01'],
        triggerAttributes: [],
        autoCalculationBasis: 'Total depreciation as per books'
    },
    {
        id: 'ADJ-08',
        section: 'Sec 32',
        description: 'Less: Depreciation as per IT Act',
        adjustmentType: 'DEPRECIATION',
        direction: 'LESS',
        triggerGroupings: ['A.10.01', 'A.10.02', 'A.10.03', 'A.10.04', 'A.10.05'],
        triggerAttributes: [],
        autoCalculationBasis: 'Manual entry - IT Act depreciation schedule'
    },

    // === DEDUCTIONS ===
    {
        id: 'ADJ-09',
        section: 'Sec 10',
        description: 'Less: Exempt Income (Dividend)',
        adjustmentType: 'EXEMPT',
        direction: 'LESS',
        triggerGroupings: ['C.20.02'],
        triggerAttributes: [],
        autoCalculationBasis: 'Dividend income received'
    },
    {
        id: 'ADJ-10',
        section: 'Sec 43B',
        description: 'Less: Sec 43B disallowances of earlier year paid',
        adjustmentType: 'DEDUCTION',
        direction: 'LESS',
        triggerGroupings: [],
        triggerAttributes: [],
        autoCalculationBasis: 'Manual entry - prior year 43B now paid'
    }
];

// ============================================================================
// GENERATE TAX BRIDGE
// ============================================================================
export function generateTaxBridge(
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): TaxBridgeResult {

    // Calculate Book Profit
    const revenue = trialBalanceData
        .filter(i => i.isMapped && i.minorHeadCode?.startsWith('C.10'))
        .reduce((s, i) => s + Math.abs(i.closingCy), 0);
    const revenuePY = trialBalanceData
        .filter(i => i.isMapped && i.minorHeadCode?.startsWith('C.10'))
        .reduce((s, i) => s + Math.abs(i.closingPy), 0);

    const expenses = trialBalanceData
        .filter(i => i.isMapped && i.majorHeadCode === 'C' && !i.minorHeadCode?.startsWith('C.10'))
        .reduce((s, i) => s + Math.abs(i.closingCy), 0);
    const expensesPY = trialBalanceData
        .filter(i => i.isMapped && i.majorHeadCode === 'C' && !i.minorHeadCode?.startsWith('C.10'))
        .reduce((s, i) => s + Math.abs(i.closingPy), 0);

    const bookProfit = revenue - expenses;
    const bookProfitPY = revenuePY - expensesPY;

    // Generate adjustments
    const adjustments: TaxAdjustment[] = [];

    for (const template of ADJUSTMENT_TEMPLATES) {
        let amountCY = 0;
        let amountPY = 0;
        let hasData = false;

        // Check if any triggering groupings have data
        if (template.triggerGroupings.length > 0) {
            for (const item of trialBalanceData) {
                if (!item.isMapped || !item.groupingCode) continue;
                if (!template.triggerGroupings.includes(item.groupingCode)) continue;

                // Check attributes if specified
                if (template.triggerAttributes.length > 0 && item.attributes) {
                    const hasAttr = template.triggerAttributes.some(attr => item.attributes?.[attr]);
                    if (!hasAttr) continue;
                }

                amountCY += Math.abs(item.closingCy);
                amountPY += Math.abs(item.closingPy);
                hasData = true;
            }
        }

        // Only include adjustment if there's data or it's a manual adjustment
        if (hasData || template.triggerGroupings.length === 0) {
            adjustments.push({
                ...template,
                amountCY,
                amountPY,
                isManual: template.triggerGroupings.length === 0
            });
        }
    }

    // Calculate totals
    const totalAdditions = adjustments
        .filter(a => a.direction === 'ADD')
        .reduce((s, a) => s + a.amountCY, 0);
    const totalAdditionsPY = adjustments
        .filter(a => a.direction === 'ADD')
        .reduce((s, a) => s + a.amountPY, 0);

    const totalDeductions = adjustments
        .filter(a => a.direction === 'LESS')
        .reduce((s, a) => s + a.amountCY, 0);
    const totalDeductionsPY = adjustments
        .filter(a => a.direction === 'LESS')
        .reduce((s, a) => s + a.amountPY, 0);

    const taxableIncome = bookProfit + totalAdditions - totalDeductions;
    const taxableIncomePY = bookProfitPY + totalAdditionsPY - totalDeductionsPY;

    return {
        bookProfit,
        bookProfitPY,
        adjustments,
        totalAdditions,
        totalAdditionsPY,
        totalDeductions,
        totalDeductionsPY,
        taxableIncome,
        taxableIncomePY
    };
}

// ============================================================================
// FORMAT HELPER
// ============================================================================
export function formatTaxBridgeAmount(amount: number): string {
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.abs(amount));

    return amount < 0 ? `(${formatted})` : formatted;
}
