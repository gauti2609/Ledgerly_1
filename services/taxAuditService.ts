import { TrialBalanceItem, Masters, LedgerAttributes } from '../types.ts';

// ============================================================================
// FORM 3CD (TAX AUDIT) AUTO-POPULATION SERVICE
// Based on Schedule_III_CARO_3CD_Cashflow_Layer.xlsx - 3CD Mappings
// ============================================================================

export interface TaxAuditClause {
    clauseId: string;
    clauseNumber: string;
    title: string;
    triggerGroupings: string[];
    triggerAttributes: (keyof LedgerAttributes)[];
    autoPopulateFields: string[];
}

export interface TaxAuditAutoResult {
    clauseId: string;
    clauseNumber: string;
    title: string;
    isRelevant: boolean;
    relevanceReason: string;
    triggeringLedgers: { ledger: string; amount: number; grouping: string }[];
    totalAmount: number;
    autoPopulatedData: Record<string, any>;
}

// Key 3CD Clauses that can be auto-populated from mapped TB data
export const TAX_AUDIT_CLAUSES: TaxAuditClause[] = [
    {
        clauseId: '18',
        clauseNumber: '18',
        title: 'Depreciation',
        triggerGroupings: ['A.10.01', 'A.10.02', 'A.10.03', 'A.10.04', 'A.10.05', 'A.10.06', 'A.10.07', 'A.10.08', 'A.10.09', 'A.10.10', 'A.10.11', 'A.20.01', 'A.20.02', 'A.20.03', 'A.20.04'],
        triggerAttributes: [],
        autoPopulateFields: ['totalPPE', 'totalIntangibles']
    },
    {
        clauseId: '21',
        clauseNumber: '21',
        title: 'Amounts Inadmissible',
        triggerGroupings: ['C.90.01', 'C.90.02', 'C.90.03', 'C.90.04', 'C.90.05', 'C.90.06', 'C.90.07', 'C.90.08', 'C.90.09', 'C.90.10', 'C.90.11', 'C.90.12'],
        triggerAttributes: [],
        autoPopulateFields: ['otherExpensesBreakdown']
    },
    {
        clauseId: '22',
        clauseNumber: '22',
        title: 'MSME Interest',
        triggerGroupings: ['B.80.01'], // Trade Payables - MSME
        triggerAttributes: ['isMSME'],
        autoPopulateFields: ['msmeTotalPayables', 'msmeLedgers']
    },
    {
        clauseId: '23',
        clauseNumber: '23',
        title: 'Related Party Payments',
        triggerGroupings: ['A.60.02', 'A.130.03', 'B.30.05', 'B.70.05'], // Related Party groupings
        triggerAttributes: ['isRelatedParty'],
        autoPopulateFields: ['relatedPartyTransactions']
    },
    {
        clauseId: '26',
        clauseNumber: '26',
        title: 'Section 43B Liabilities',
        triggerGroupings: ['B.90.01', 'B.90.02', 'B.90.03'], // Statutory Dues
        triggerAttributes: [],
        autoPopulateFields: ['statutoryDues']
    },
    {
        clauseId: '31',
        clauseNumber: '31',
        title: 'Loans (Sec 269SS/269T)',
        triggerGroupings: ['B.30.01', 'B.30.02', 'B.30.03', 'B.30.04', 'B.30.05', 'B.30.06', 'B.70.01', 'B.70.02', 'B.70.03', 'B.70.04', 'B.70.05'],
        triggerAttributes: [],
        autoPopulateFields: ['totalBorrowings', 'borrowingsLedgers']
    },
    {
        clauseId: '35',
        clauseNumber: '35',
        title: 'Quantitative Details (Inventory)',
        triggerGroupings: ['A.100.01', 'A.100.02', 'A.100.03', 'A.100.04', 'A.100.05', 'A.100.06', 'A.100.07', 'A.100.08'],
        triggerAttributes: [],
        autoPopulateFields: ['inventoryBreakdown']
    },
    {
        clauseId: '40',
        clauseNumber: '40',
        title: 'Accounting Ratios',
        triggerGroupings: [], // Uses all data
        triggerAttributes: [],
        autoPopulateFields: ['gpRatio', 'npRatio', 'stockTurnover']
    }
];

// ============================================================================
// DETERMINE RELEVANCE FOR A CLAUSE
// ============================================================================
export function determineClauseRelevance(
    clause: TaxAuditClause,
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): TaxAuditAutoResult {

    const triggeringLedgers: { ledger: string; amount: number; grouping: string }[] = [];

    for (const item of trialBalanceData) {
        if (!item.isMapped || !item.groupingCode) continue;

        let isTriggered = false;

        // Check grouping triggers
        if (clause.triggerGroupings.length > 0 && clause.triggerGroupings.includes(item.groupingCode)) {
            isTriggered = true;
        }

        // Check attribute triggers
        if (clause.triggerAttributes.length > 0 && item.attributes) {
            for (const attrKey of clause.triggerAttributes) {
                if (item.attributes[attrKey]) {
                    isTriggered = true;
                    break;
                }
            }
        }

        if (isTriggered && item.closingCy !== 0) {
            const groupingName = masters.groupings.find(g => g.code === item.groupingCode)?.name || item.groupingCode;
            triggeringLedgers.push({
                ledger: item.ledger,
                amount: item.closingCy,
                grouping: groupingName
            });
        }
    }

    const totalAmount = triggeringLedgers.reduce((sum, l) => sum + Math.abs(l.amount), 0);
    const isRelevant = triggeringLedgers.length > 0 || clause.triggerGroupings.length === 0;

    // Build auto-populated data based on clause
    const autoPopulatedData = buildAutoPopulatedData(clause, triggeringLedgers, totalAmount, trialBalanceData, masters);

    return {
        clauseId: clause.clauseId,
        clauseNumber: clause.clauseNumber,
        title: clause.title,
        isRelevant,
        relevanceReason: isRelevant
            ? `${triggeringLedgers.length} ledger(s) totaling ₹${totalAmount.toLocaleString()} found.`
            : 'No relevant transactions found.',
        triggeringLedgers,
        totalAmount,
        autoPopulatedData
    };
}

// ============================================================================
// BUILD AUTO-POPULATED DATA PER CLAUSE
// ============================================================================
function buildAutoPopulatedData(
    clause: TaxAuditClause,
    triggeringLedgers: { ledger: string; amount: number; grouping: string }[],
    totalAmount: number,
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): Record<string, any> {
    const data: Record<string, any> = {};

    switch (clause.clauseId) {
        case '18': // Depreciation
            // Group by PPE category
            const ppeItems = triggeringLedgers.filter(l => l.grouping.includes('PPE') || l.grouping.includes('Land') || l.grouping.includes('Building'));
            const intangibleItems = triggeringLedgers.filter(l => l.grouping.includes('Intangible') || l.grouping.includes('Software'));
            data.response = `Total PPE: ₹${ppeItems.reduce((s, l) => s + l.amount, 0).toLocaleString()}. Intangibles: ₹${intangibleItems.reduce((s, l) => s + l.amount, 0).toLocaleString()}.`;
            data.remarks = `[Auto-detected] ${triggeringLedgers.length} asset ledgers identified. Depreciation schedule to be prepared as per IT Act rates.`;
            break;

        case '22': // MSME Interest
            const msmeItems = triggeringLedgers.filter(l => l.grouping.toLowerCase().includes('msme'));
            data.response = msmeItems.length > 0
                ? `MSME payables of ₹${totalAmount.toLocaleString()} identified. Interest calculation under Sec 23 of MSMED Act required.`
                : 'No MSME payables identified.';
            data.remarks = `[Auto-detected] ${msmeItems.length} MSME vendor ledger(s) found.`;
            break;

        case '23': // Related Party
            data.response = triggeringLedgers.length > 0
                ? `Related party transactions of ₹${totalAmount.toLocaleString()} identified across ${triggeringLedgers.length} ledger(s).`
                : 'No related party transactions identified from ledger attributes.';
            data.tableData = triggeringLedgers.slice(0, 10).map(l => ({
                name: l.ledger,
                nature: l.grouping,
                amount: l.amount.toLocaleString()
            }));
            data.remarks = `[Auto-detected] Verify Sec 40A(2)(b) applicability.`;
            break;

        case '26': // Section 43B
            data.response = triggeringLedgers.length > 0
                ? `Statutory dues of ₹${totalAmount.toLocaleString()} identified. Verify payment before due date.`
                : 'No statutory dues identified.';
            data.remarks = `[Auto-detected] ${triggeringLedgers.length} statutory liability ledger(s) found.`;
            break;

        case '31': // Loans 269SS/269T
            data.response = triggeringLedgers.length > 0
                ? `Total borrowings of ₹${totalAmount.toLocaleString()} identified. Verify mode of receipt/repayment for Sec 269SS/269T compliance.`
                : 'No loans/borrowings identified.';
            data.remarks = `[Auto-detected] ${triggeringLedgers.length} borrowing ledger(s) found.`;
            break;

        case '35': // Inventory - Quantitative
            data.response = triggeringLedgers.length > 0
                ? `Closing inventory of ₹${totalAmount.toLocaleString()} across ${triggeringLedgers.length} categories.`
                : 'No inventory identified.';
            data.remarks = `[Auto-detected] Opening/Closing reconciliation required.`;
            break;

        case '40': // Ratios
            // Calculate ratios from TB data
            const revenue = trialBalanceData.filter(i => i.isMapped && i.minorHeadCode?.startsWith('C.10')).reduce((s, i) => s + Math.abs(i.closingCy), 0);
            const cogs = trialBalanceData.filter(i => i.isMapped && i.minorHeadCode?.startsWith('C.30')).reduce((s, i) => s + Math.abs(i.closingCy), 0);
            const expenses = trialBalanceData.filter(i => i.isMapped && i.majorHeadCode === 'C' && !i.minorHeadCode?.startsWith('C.10')).reduce((s, i) => s + Math.abs(i.closingCy), 0);

            const gp = revenue - cogs;
            const np = gp - expenses;
            const gpRatio = revenue > 0 ? ((gp / revenue) * 100).toFixed(2) : '0.00';
            const npRatio = revenue > 0 ? ((np / revenue) * 100).toFixed(2) : '0.00';

            data.response = `GP Ratio: ${gpRatio}%, NP Ratio: ${npRatio}%`;
            data.gpRatio = gpRatio;
            data.npRatio = npRatio;
            data.turnover = revenue.toLocaleString();
            data.remarks = `[Auto-calculated] Revenue: ₹${revenue.toLocaleString()}, GP: ₹${gp.toLocaleString()}, NP: ₹${np.toLocaleString()}`;
            break;

        default:
            data.remarks = `[Auto-detected] ${triggeringLedgers.length} relevant ledger(s) totaling ₹${totalAmount.toLocaleString()}.`;
    }

    return data;
}

// ============================================================================
// DETERMINE RELEVANCE FOR ALL CLAUSES
// ============================================================================
export function determineAllClauseRelevance(
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): TaxAuditAutoResult[] {
    return TAX_AUDIT_CLAUSES.map(clause => determineClauseRelevance(clause, trialBalanceData, masters));
}

// ============================================================================
// GET SUMMARY
// ============================================================================
export function getTaxAuditSummary(results: TaxAuditAutoResult[]): {
    totalClauses: number;
    relevantClauses: number;
    requiresAttention: number;
} {
    return {
        totalClauses: results.length,
        relevantClauses: results.filter(r => r.isRelevant).length,
        requiresAttention: results.filter(r => r.triggeringLedgers.length > 0).length
    };
}
