import { TrialBalanceItem, Masters, LedgerAttributes } from '../types.ts';

// ============================================================================
// CASH FLOW GENERATOR SERVICE - INDIRECT METHOD
// Based on Schedule_III_CARO_3CD_Cashflow_Layer.xlsx - Cash Flow Mappings
// ============================================================================

export type CashFlowCategory = 'OPERATING' | 'INVESTING' | 'FINANCING';
export type CashFlowSign = 'ADD' | 'DEDUCT';

export interface CashFlowLineItem {
    name: string;
    amountCY: number;
    amountPY: number;
    category: CashFlowCategory;
    sign: CashFlowSign;
    order: number;
    isComputed?: boolean;
    sourceGroupings?: string[];
}

export interface CashFlowStatement {
    netProfitBeforeTax: number;
    netProfitBeforeTaxPY: number;
    operatingActivities: CashFlowLineItem[];
    investingActivities: CashFlowLineItem[];
    financingActivities: CashFlowLineItem[];
    netCashFromOperating: number;
    netCashFromOperatingPY: number;
    netCashFromInvesting: number;
    netCashFromInvestingPY: number;
    netCashFromFinancing: number;
    netCashFromFinancingPY: number;
    netIncreaseInCash: number;
    netIncreaseInCashPY: number;
    openingCash: number;
    openingCashPY: number;
    closingCash: number;
    closingCashPY: number;
}

// ============================================================================
// GROUPING TO CASH FLOW MAPPING
// ============================================================================
interface CashFlowMapping {
    triggerGroupings: string[];
    name: string;
    category: CashFlowCategory;
    sign: CashFlowSign;
    order: number;
    isBalanceChange?: boolean;  // true = use change in balance
}

const CASH_FLOW_MAPPINGS: CashFlowMapping[] = [
    // === OPERATING ACTIVITIES: Adjustments to Net Profit ===
    { triggerGroupings: ['C.50.01'], name: 'Depreciation and Amortisation', category: 'OPERATING', sign: 'ADD', order: 10 },
    { triggerGroupings: ['C.70.01', 'C.70.02'], name: 'Finance Costs', category: 'OPERATING', sign: 'ADD', order: 20 },
    { triggerGroupings: ['C.20.01'], name: 'Interest Income', category: 'OPERATING', sign: 'DEDUCT', order: 30 },
    { triggerGroupings: ['C.20.02'], name: 'Dividend Income', category: 'OPERATING', sign: 'DEDUCT', order: 40 },
    { triggerGroupings: ['C.20.03', 'C.20.04'], name: 'Profit on Sale of Investments/Assets', category: 'OPERATING', sign: 'DEDUCT', order: 50 },
    { triggerGroupings: ['C.90.05'], name: 'Loss on Sale of Assets', category: 'OPERATING', sign: 'ADD', order: 60 },
    { triggerGroupings: ['B.100.01', 'B.100.02'], name: 'Provisions', category: 'OPERATING', sign: 'ADD', order: 70 },

    // === OPERATING ACTIVITIES: Changes in Working Capital ===
    { triggerGroupings: ['A.100.01', 'A.100.02', 'A.100.03', 'A.100.04', 'A.100.05'], name: '(Increase)/Decrease in Inventories', category: 'OPERATING', sign: 'DEDUCT', order: 100, isBalanceChange: true },
    { triggerGroupings: ['A.110.01', 'A.110.02', 'A.110.03', 'A.110.04'], name: '(Increase)/Decrease in Trade Receivables', category: 'OPERATING', sign: 'DEDUCT', order: 110, isBalanceChange: true },
    { triggerGroupings: ['A.130.01', 'A.130.02', 'A.130.04', 'A.130.05', 'A.130.06', 'A.130.07', 'A.130.08', 'A.130.09', 'A.130.10'], name: '(Increase)/Decrease in Other Current Assets', category: 'OPERATING', sign: 'DEDUCT', order: 120, isBalanceChange: true },
    { triggerGroupings: ['B.80.01', 'B.80.02', 'B.80.03'], name: 'Increase/(Decrease) in Trade Payables', category: 'OPERATING', sign: 'ADD', order: 130, isBalanceChange: true },
    { triggerGroupings: ['B.90.01', 'B.90.02', 'B.90.03', 'B.90.04', 'B.90.05', 'B.90.06'], name: 'Increase/(Decrease) in Other Current Liabilities', category: 'OPERATING', sign: 'ADD', order: 140, isBalanceChange: true },

    // === INVESTING ACTIVITIES ===
    { triggerGroupings: ['A.10.01', 'A.10.02', 'A.10.03', 'A.10.04', 'A.10.05', 'A.10.06', 'A.10.07', 'A.10.08', 'A.10.09', 'A.10.10', 'A.10.11'], name: 'Purchase of Property, Plant and Equipment', category: 'INVESTING', sign: 'DEDUCT', order: 10, isBalanceChange: true },
    { triggerGroupings: ['A.20.01', 'A.20.02', 'A.20.03', 'A.20.04'], name: 'Purchase of Intangible Assets', category: 'INVESTING', sign: 'DEDUCT', order: 20, isBalanceChange: true },
    { triggerGroupings: ['A.50.01', 'A.50.02', 'A.50.03', 'A.50.04', 'A.50.05', 'A.50.06', 'A.50.07', 'A.50.08', 'A.50.09', 'A.50.10', 'A.50.11'], name: 'Purchase of Investments', category: 'INVESTING', sign: 'DEDUCT', order: 30, isBalanceChange: true },
    { triggerGroupings: ['A.60.01', 'A.60.02', 'A.60.03'], name: 'Loans Given', category: 'INVESTING', sign: 'DEDUCT', order: 40, isBalanceChange: true },

    // === FINANCING ACTIVITIES ===
    { triggerGroupings: ['B.10.01', 'B.10.02', 'B.10.03'], name: 'Proceeds from Issue of Share Capital', category: 'FINANCING', sign: 'ADD', order: 10, isBalanceChange: true },
    { triggerGroupings: ['B.30.01', 'B.30.02', 'B.30.03', 'B.30.04', 'B.30.05', 'B.30.06'], name: 'Proceeds from Long-Term Borrowings', category: 'FINANCING', sign: 'ADD', order: 20, isBalanceChange: true },
    { triggerGroupings: ['B.70.01', 'B.70.02', 'B.70.03', 'B.70.04', 'B.70.05'], name: 'Proceeds/(Repayment) of Short-Term Borrowings', category: 'FINANCING', sign: 'ADD', order: 30, isBalanceChange: true },
    { triggerGroupings: ['C.70.01', 'C.70.02'], name: 'Interest Paid', category: 'FINANCING', sign: 'DEDUCT', order: 40 },
    { triggerGroupings: ['B.20.03'], name: 'Dividends Paid', category: 'FINANCING', sign: 'DEDUCT', order: 50, isBalanceChange: true },
];

// ============================================================================
// GENERATE CASH FLOW STATEMENT
// ============================================================================
export function generateCashFlowStatement(
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): CashFlowStatement {

    // Helper to get total for groupings
    const getTotal = (groupings: string[], currentYear: boolean = true): number => {
        return trialBalanceData
            .filter(item => item.isMapped && item.groupingCode && groupings.includes(item.groupingCode))
            .reduce((sum, item) => sum + (currentYear ? item.closingCy : item.closingPy), 0);
    };

    // Helper to get change (for working capital)
    const getChange = (groupings: string[]): { cy: number; py: number } => {
        const totalCY = getTotal(groupings, true);
        const totalPY = getTotal(groupings, false);
        return { cy: totalCY - totalPY, py: 0 }; // PY change not available without prior year PY
    };

    // Calculate Net Profit Before Tax
    const revenueCY = Math.abs(getTotal(['C.10.01', 'C.10.02', 'C.10.03', 'C.10.04', 'C.10.05'], true));
    const revenuePY = Math.abs(getTotal(['C.10.01', 'C.10.02', 'C.10.03', 'C.10.04', 'C.10.05'], false));

    // Get all P&L expenses (Major Head C, excluding revenue)
    const expenseGroupings = masters.groupings.filter(g => g.code.startsWith('C.') && !g.code.startsWith('C.10'));
    const expensesCY = expenseGroupings.reduce((sum, g) => sum + getTotal([g.code], true), 0);
    const expensesPY = expenseGroupings.reduce((sum, g) => sum + getTotal([g.code], false), 0);

    const netProfitBeforeTax = revenueCY - expensesCY;
    const netProfitBeforeTaxPY = revenuePY - expensesPY;

    // Generate line items
    const operatingActivities: CashFlowLineItem[] = [];
    const investingActivities: CashFlowLineItem[] = [];
    const financingActivities: CashFlowLineItem[] = [];

    for (const mapping of CASH_FLOW_MAPPINGS) {
        let amountCY = 0;
        let amountPY = 0;

        if (mapping.isBalanceChange) {
            // For balance sheet items, calculate change
            const change = getChange(mapping.triggerGroupings);
            amountCY = change.cy;
            amountPY = change.py;

            // For assets, increase = cash outflow
            if (mapping.category === 'OPERATING' && mapping.sign === 'DEDUCT') {
                amountCY = -amountCY; // Increase in asset is deduct
            }
        } else {
            // For P&L items, use absolute value
            amountCY = Math.abs(getTotal(mapping.triggerGroupings, true));
            amountPY = Math.abs(getTotal(mapping.triggerGroupings, false));
        }

        // Skip if zero
        if (amountCY === 0 && amountPY === 0) continue;

        const lineItem: CashFlowLineItem = {
            name: mapping.name,
            amountCY: mapping.sign === 'ADD' ? amountCY : -amountCY,
            amountPY: mapping.sign === 'ADD' ? amountPY : -amountPY,
            category: mapping.category,
            sign: mapping.sign,
            order: mapping.order,
            sourceGroupings: mapping.triggerGroupings
        };

        if (mapping.category === 'OPERATING') operatingActivities.push(lineItem);
        else if (mapping.category === 'INVESTING') investingActivities.push(lineItem);
        else financingActivities.push(lineItem);
    }

    // Sort by order
    operatingActivities.sort((a, b) => a.order - b.order);
    investingActivities.sort((a, b) => a.order - b.order);
    financingActivities.sort((a, b) => a.order - b.order);

    // Calculate totals
    const netCashFromOperating = netProfitBeforeTax + operatingActivities.reduce((s, i) => s + i.amountCY, 0);
    const netCashFromOperatingPY = netProfitBeforeTaxPY + operatingActivities.reduce((s, i) => s + i.amountPY, 0);
    const netCashFromInvesting = investingActivities.reduce((s, i) => s + i.amountCY, 0);
    const netCashFromInvestingPY = investingActivities.reduce((s, i) => s + i.amountPY, 0);
    const netCashFromFinancing = financingActivities.reduce((s, i) => s + i.amountCY, 0);
    const netCashFromFinancingPY = financingActivities.reduce((s, i) => s + i.amountPY, 0);

    const netIncreaseInCash = netCashFromOperating + netCashFromInvesting + netCashFromFinancing;
    const netIncreaseInCashPY = netCashFromOperatingPY + netCashFromInvestingPY + netCashFromFinancingPY;

    // Get cash balances
    const cashGroupings = ['A.120.01', 'A.120.02', 'A.120.03', 'A.120.04', 'A.120.05'];
    const closingCash = getTotal(cashGroupings, true);
    const openingCash = getTotal(cashGroupings, false);
    const closingCashPY = openingCash;
    const openingCashPY = closingCashPY - netIncreaseInCashPY;

    return {
        netProfitBeforeTax,
        netProfitBeforeTaxPY,
        operatingActivities,
        investingActivities,
        financingActivities,
        netCashFromOperating,
        netCashFromOperatingPY,
        netCashFromInvesting,
        netCashFromInvestingPY,
        netCashFromFinancing,
        netCashFromFinancingPY,
        netIncreaseInCash,
        netIncreaseInCashPY,
        openingCash,
        openingCashPY,
        closingCash,
        closingCashPY
    };
}

// ============================================================================
// FORMAT CURRENCY
// ============================================================================
export function formatCashFlowAmount(amount: number): string {
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.abs(amount));

    return amount < 0 ? `(${formatted})` : formatted;
}
