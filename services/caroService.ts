import { TrialBalanceItem, Masters, LedgerAttributes } from '../types.ts';

// ============================================================================
// CARO-2020 AUTO-APPLICABILITY SERVICE
// Based on Schedule_III_CARO_3CD_Cashflow_Layer.xlsx - CARO-2020 Bindings
// ============================================================================

export interface CAROClause {
    clauseId: string;
    clauseNumber: string;
    title: string;
    description: string;
    triggerGroupings: string[];  // Grouping codes that trigger applicability
    triggerAttributes: (keyof LedgerAttributes)[];  // Attributes that trigger applicability
    applicableTemplate: string;
    notApplicableTemplate: string;
    requiresInput: string[];  // Fields that require manual input
}

export interface CAROApplicabilityResult {
    clauseId: string;
    clauseNumber: string;
    title: string;
    isApplicable: boolean;
    applicabilityReason: string;
    triggeringLedgers: { ledger: string; amount: number; grouping: string }[];
    totalAmount: number;
    responseText: string;
    requiresInput: string[];
}

// CARO-2020 Clause Definitions based on Gold Master
export const CARO_CLAUSES: CAROClause[] = [
    {
        clauseId: 'CARO-3i',
        clauseNumber: '3(i)',
        title: 'Property, Plant and Equipment',
        description: 'Whether proper records showing full particulars including quantitative details and situation of PPE are maintained.',
        triggerGroupings: ['A.10.01', 'A.10.02', 'A.10.03', 'A.10.04', 'A.10.05', 'A.10.06', 'A.10.07', 'A.10.08', 'A.10.09', 'A.10.10', 'A.10.11'],
        triggerAttributes: [],
        applicableTemplate: 'According to the information and explanations given to us and on the basis of our examination of the records of the Company, the Company has maintained proper records showing full particulars, including quantitative details and situation of Property, Plant and Equipment.',
        notApplicableTemplate: 'The Company does not have any Property, Plant and Equipment.',
        requiresInput: ['physical_verification_conducted', 'discrepancies_found']
    },
    {
        clauseId: 'CARO-3ii',
        clauseNumber: '3(ii)',
        title: 'Inventories',
        description: 'Whether physical verification of inventory has been conducted at reasonable intervals.',
        triggerGroupings: ['A.100.01', 'A.100.02', 'A.100.03', 'A.100.04', 'A.100.05', 'A.100.06', 'A.100.07', 'A.100.08'],
        triggerAttributes: [],
        applicableTemplate: 'In our opinion, the frequency of verification of inventories by the management is reasonable and the coverage and procedure of such verification is appropriate. No discrepancies of 10% or more in the aggregate for each class of inventory were noticed on such verification.',
        notApplicableTemplate: 'The Company does not hold any inventories.',
        requiresInput: ['verification_frequency', 'discrepancy_percentage']
    },
    {
        clauseId: 'CARO-3iii',
        clauseNumber: '3(iii)',
        title: 'Loans to Related Parties',
        description: 'Whether the company has granted any loans, secured or unsecured, to companies/firms/LLPs or other parties covered in the Register maintained under Section 189 of the Act.',
        triggerGroupings: ['A.60.02', 'A.130.03'], // Loans to Related Parties
        triggerAttributes: ['isRelatedParty'],
        applicableTemplate: 'According to the information and explanations given to us and on the basis of our examination of the records of the Company, the Company has made loans to parties covered in the register maintained under Section 189 of the Act. The terms and conditions of which are not prejudicial to the interest of the Company.',
        notApplicableTemplate: 'The Company has not granted any loans, secured or unsecured, to companies, firms, limited liability partnerships, or other parties covered in the Register maintained under Section 189 of the Companies Act, 2013.',
        requiresInput: ['terms_prejudicial', 'repayment_schedule', 'overdue_amount']
    },
    {
        clauseId: 'CARO-3vii',
        clauseNumber: '3(vii)',
        title: 'Statutory Dues',
        description: 'Whether the company is regular in depositing undisputed statutory dues including provident fund, employees\' state insurance, income-tax, sales-tax, service tax, duty of customs, duty of excise, value added tax, cess, GST.',
        triggerGroupings: ['B.90.01'], // Statutory Dues Payable
        triggerAttributes: [],
        applicableTemplate: 'According to the records of the Company, undisputed statutory dues including provident fund, employees\' state insurance, income-tax, goods and services tax, duty of customs, cess and other material statutory dues, as applicable, have generally been regularly deposited with the appropriate authorities though there has been delay in certain cases.',
        notApplicableTemplate: 'The Company does not have any undisputed statutory dues payable.',
        requiresInput: ['delay_details', 'disputed_dues']
    },
    {
        clauseId: 'CARO-3ix',
        clauseNumber: '3(ix)',
        title: 'Default in Repayment',
        description: 'Whether the company has defaulted in repayment of loans or borrowings to any lender.',
        triggerGroupings: ['B.30.01', 'B.30.02', 'B.30.03', 'B.30.04', 'B.30.05', 'B.30.06', 'B.70.01', 'B.70.02', 'B.70.03', 'B.70.04', 'B.70.05'],
        triggerAttributes: [],
        applicableTemplate: 'In our opinion and according to the information and explanations given to us, the Company has not defaulted in repayment of loans or borrowings from any financial institution, bank, government or dues to debenture holders during the year.',
        notApplicableTemplate: 'The Company does not have any outstanding loans or borrowings.',
        requiresInput: ['default_details', 'default_period']
    },
    {
        clauseId: 'CARO-3xi',
        clauseNumber: '3(xi)',
        title: 'Fraud Reporting',
        description: 'Whether any fraud by the company or any fraud on the company by its officers or employees has been noticed or reported during the year.',
        triggerGroupings: [], // No specific grouping - general clause
        triggerAttributes: [],
        applicableTemplate: 'According to the information and explanations given to us, no fraud by the Company or no fraud on the Company by its officers or employees has been noticed or reported during the year.',
        notApplicableTemplate: 'No fraud by the Company or on the Company by its officers or employees has been noticed or reported during the year.',
        requiresInput: ['fraud_details']
    }
];

// ============================================================================
// DETERMINE APPLICABILITY FOR A CLAUSE
// ============================================================================
export function determineClauseApplicability(
    clause: CAROClause,
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): CAROApplicabilityResult {

    // Find triggering ledgers
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
    const isApplicable = triggeringLedgers.length > 0 || clause.triggerGroupings.length === 0; // Fraud clause is always reviewed

    return {
        clauseId: clause.clauseId,
        clauseNumber: clause.clauseNumber,
        title: clause.title,
        isApplicable,
        applicabilityReason: isApplicable
            ? `${triggeringLedgers.length} ledger(s) totaling ₹${totalAmount.toLocaleString()} trigger this clause.`
            : 'No relevant transactions found.',
        triggeringLedgers,
        totalAmount,
        responseText: isApplicable ? clause.applicableTemplate : clause.notApplicableTemplate,
        requiresInput: isApplicable ? clause.requiresInput : []
    };
}

// ============================================================================
// DETERMINE APPLICABILITY FOR ALL CLAUSES
// ============================================================================
export function determineAllClauseApplicability(
    trialBalanceData: TrialBalanceItem[],
    masters: Masters
): CAROApplicabilityResult[] {
    return CARO_CLAUSES.map(clause => determineClauseApplicability(clause, trialBalanceData, masters));
}

// ============================================================================
// GET SUMMARY STATISTICS
// ============================================================================
export function getCAROSummary(results: CAROApplicabilityResult[]): {
    totalClauses: number;
    applicableClauses: number;
    notApplicableClauses: number;
    inputRequired: number;
} {
    return {
        totalClauses: results.length,
        applicableClauses: results.filter(r => r.isApplicable).length,
        notApplicableClauses: results.filter(r => !r.isApplicable).length,
        inputRequired: results.filter(r => r.requiresInput.length > 0).length
    };
}
