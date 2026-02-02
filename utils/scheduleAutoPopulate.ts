
import { AllData, ScheduleData, TrialBalanceItem, TradePayablesAgeingRow, InventoryBalanceRow, PpeAssetRow, ShareCapitalItem, BorrowingItem, TradeReceivablesData, CashComponent, GenericScheduleItem, OtherEquityItem, CWIPRow, InvestmentItem, LoanAdvanceItem, ProvisionReconciliationRow, DeferredTaxRow } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';

export const populateScheduleFromTB = (allData: AllData, scheduleId: string, decimalPlaces: number = 2): Partial<ScheduleData> | null => {
    const { trialBalanceData, scheduleData, masters } = allData;

    const parse = (val: number | undefined) => {
        if (val === undefined || val === null) return '0.00';
        return Math.abs(val).toFixed(decimalPlaces);
    };

    // Helper to aggregate ledgers by grouping code
    const aggregateByGrouping = (prefix: string): GenericScheduleItem[] => {
        const groupingMap = new Map<string, { code: string; name: string; cy: number; py: number }>();

        trialBalanceData.forEach(l => {
            if (!l.isMapped || !l.groupingCode?.startsWith(prefix)) return;

            const code = l.groupingCode;
            if (!groupingMap.has(code)) {
                // Find grouping name from masters
                const grouping = masters?.groupings.find(g => g.code === code);
                // Fallback to ledger name if grouping not found (should be rare) or just code
                const name = grouping ? grouping.name : `Unknown Grouping (${code})`;

                groupingMap.set(code, { code, name, cy: 0, py: 0 });
            }

            const entry = groupingMap.get(code)!;
            entry.cy += l.closingCy;
            entry.py += l.closingPy;
        });

        return Array.from(groupingMap.values()).map(g => ({
            id: uuidv4(),
            particular: g.name,
            amountCy: parse(g.cy),
            amountPy: parse(g.py),
            groupingCode: g.code
        }));
    };

    // Helper for specific return types if needed (like LoanAdvanceItem) usually compatible with Generic if fields match
    // or we map Generic results to specific types.

    // --- TRADE PAYABLES (B.80) ---
    if (scheduleId === 'tradePayables') {
        const apListTotal = parseFloat(scheduleData.apList?.tradeBalance || '0');

        // We calculate total from ledgers for validation/fallback
        const tradePayablesTotal = trialBalanceData
            .filter(i => i.isMapped && (i.groupingCode?.startsWith('B.80') || i.groupingCode === 'B.50.01'))
            .reduce((sum, item) => sum + item.closingCy, 0);

        const totalCy = apListTotal > 0 ? apListTotal : tradePayablesTotal;

        // Reset to "Others - <1 Year" bucket as default
        const newAgeing: TradePayablesAgeingRow[] = [
            { category: 'others', lessThan1Year: parse(totalCy), '1To2Years': '0', '2To3Years': '0', moreThan3Years: '0' },
            { category: 'msme', lessThan1Year: '0', '1To2Years': '0', '2To3Years': '0', moreThan3Years: '0' },
            { category: 'disputedOthers', lessThan1Year: '0', '1To2Years': '0', '2To3Years': '0', moreThan3Years: '0' },
            { category: 'disputedMsme', lessThan1Year: '0', '1To2Years': '0', '2To3Years': '0', moreThan3Years: '0' }
        ];

        return {
            ...scheduleData,
            tradePayables: {
                ...scheduleData.tradePayables,
                ageing: newAgeing
            }
        };
    }

    // --- INVENTORIES (A.100) ---
    if (scheduleId === 'inventories') {
        // Aggregate by grouping for inventories too
        const inventoryItems = aggregateByGrouping('A.100');

        // Map Generic to InventoryBalanceRow
        const newRows: InventoryBalanceRow[] = inventoryItems.map(i => ({
            id: i.id,
            item: i.particular, // Use Grouping Name
            amountCy: i.amountCy,
            amountPy: i.amountPy,
            groupingCode: i.groupingCode
        }));

        return {
            ...scheduleData,
            inventories: newRows
        };
    }

    // --- PPE (A.10) ---
    if (scheduleId === 'ppe') {
        // PPE is special because it follows a matrix structure (Asset Class -> Gross/Dep/Net)
        // We aggregate by grouping, where Grouping = Asset Class (roughly)

        // Group by Grouping Code
        const assetGroups = new Map<string, { code: string; name: string; cy: number; py: number }>();

        trialBalanceData.forEach(l => {
            // Fix: 'A.10' closely matches 'A.100' (Inventories). We need to ensure we only get A.10.* items.
            if (!l.isMapped || !(l.groupingCode === 'A.10' || l.groupingCode?.startsWith('A.10.'))) return;
            const code = l.groupingCode;

            if (!assetGroups.has(code)) {
                const grouping = masters?.groupings.find(g => g.code === code);
                const name = grouping ? grouping.name : `Asset (${code})`;
                assetGroups.set(code, { code, name, cy: 0, py: 0 });
            }
            const entry = assetGroups.get(code)!;
            entry.cy += l.closingCy;
            entry.py += l.closingPy;
        });

        const newAssets: PpeAssetRow[] = [];

        assetGroups.forEach((val) => {
            newAssets.push({
                id: uuidv4(),
                assetClass: val.name,
                isUnderLease: false,
                // Assume Net Block = Gross Block for initial population
                grossBlockOpening: parse(val.py),
                grossBlockAdditions: '0',
                grossBlockDisposals: '0',
                grossBlockClosing: parse(val.cy),
                grossBlockOpeningPy: '0',
                grossBlockAdditionsPy: '0',
                grossBlockDisposalsPy: '0',

                depreciationOpening: '0',
                depreciationForYear: '0',
                depreciationOnDisposals: '0',
                depreciationClosing: '0',
                depreciationOpeningPy: '0',
                depreciationForYearPy: '0',
                depreciationOnDisposalsPy: '0',

                impairmentLoss: '0',
                impairmentReversal: '0',
                impairmentLossPy: '0',
                impairmentReversalPy: '0',

                netBlockClosing: parse(val.cy)
            });
        });

        return {
            ...scheduleData,
            ppe: {
                ...scheduleData.ppe,
                assets: newAssets
            }
        };
    }

    // --- SHARE CAPITAL (B.10.01) ---
    if (scheduleId === 'shareCapital') {
        // This is usually a single summary figure, or a few classes
        // B.10.01 = Equity, B.10.02 = Preference

        const equityTotal = trialBalanceData
            .filter(i => i.isMapped && i.groupingCode === 'B.10.01')
            .reduce((sum, i) => sum + i.closingCy, 0);

        const equityTotalPy = trialBalanceData
            .filter(i => i.isMapped && i.groupingCode === 'B.10.01')
            .reduce((sum, i) => sum + i.closingPy, 0);

        const newIssued: ShareCapitalItem[] = [{
            id: uuidv4(),
            particular: 'Equity Share Capital',
            noOfSharesCy: '0',
            amountCy: parse(equityTotal),
            noOfSharesPy: '0',
            amountPy: parse(equityTotalPy)
        }];

        return {
            ...scheduleData,
            companyShareCapital: {
                ...scheduleData.companyShareCapital,
                issued: newIssued
            }
        };
    }

    // --- OTHER EQUITY (B.20) ---
    if (scheduleId === 'otherEquity') {
        // Aggregate by grouping
        const groupedItems = aggregateByGrouping('B.20');

        const newItems: OtherEquityItem[] = groupedItems.map(g => ({
            id: g.id,
            reserveName: g.particular,
            opening: g.amountPy, // Assume Opening = Closing PY
            additions: (parseFloat(g.amountCy) - parseFloat(g.amountPy)).toFixed(decimalPlaces),
            deductions: '0.00',
            closing: g.amountCy,
            openingPy: g.amountPy, // Just a placeholder, ideally needs PY's PY
            additionsPy: '0.00',
            deductionsPy: '0.00',
            groupingCode: g.groupingCode
        }));

        return { ...scheduleData, companyOtherEquity: newItems };
    }

    // --- BORROWINGS (B.30 Long Term, B.70 Short Term) ---
    if (scheduleId === 'borrowings') {
        const longTermGrouped = aggregateByGrouping('B.30');
        const shortTermGrouped = aggregateByGrouping('B.70');

        const toBorrowingItem = (g: GenericScheduleItem): BorrowingItem => ({
            id: g.id,
            nature: g.particular,
            classification: 'secured',
            amountCy: g.amountCy,
            amountPy: g.amountPy,
            repaymentTerms: '',
            defaultPeriod: '',
            defaultAmount: '',
            groupingCode: g.groupingCode
        });

        return {
            ...scheduleData,
            borrowings: {
                ...scheduleData.borrowings,
                longTerm: longTermGrouped.map(toBorrowingItem),
                shortTerm: shortTermGrouped.map(toBorrowingItem)
            }
        };
    }

    // --- TRADE RECEIVABLES (A.110) ---
    if (scheduleId === 'tradeReceivables') {
        const arListTotal = parseFloat(scheduleData.arList?.tradeBalance || '0');
        const tbTotal = trialBalanceData
            .filter(i => i.isMapped && i.groupingCode?.startsWith('A.110'))
            .reduce((sum, i) => sum + i.closingCy, 0);

        const totalCy = arListTotal > 0 ? arListTotal : tbTotal;

        const newAgeing = [{
            category: 'undisputedGood' as const,
            lessThan6Months: parse(totalCy),
            '6MonthsTo1Year': '0', '1To2Years': '0', '2To3Years': '0', moreThan3Years: '0'
        },
        { category: 'undisputedDoubtful' as const, lessThan6Months: '0', '6MonthsTo1Year': '0', '1To2Years': '0', '2To3Years': '0', moreThan3Years: '0' },
        { category: 'disputedGood' as const, lessThan6Months: '0', '6MonthsTo1Year': '0', '1To2Years': '0', '2To3Years': '0', moreThan3Years: '0' },
        { category: 'disputedDoubtful' as const, lessThan6Months: '0', '6MonthsTo1Year': '0', '1To2Years': '0', '2To3Years': '0', moreThan3Years: '0' }
        ];

        return {
            ...scheduleData,
            tradeReceivables: {
                ...scheduleData.tradeReceivables,
                securedGood: '0',
                unsecuredGood: parse(totalCy),
                doubtful: '0',
                provisionForDoubtful: '0',
                ageing: newAgeing
            }
        };
    }

    // --- CASH (A.120) ---
    if (scheduleId === 'cash') {
        // Special case: Cash on Hand is A.120.01, Bank is others
        const cashAgg = aggregateByGrouping('A.120');

        const cashOnHandItem = cashAgg.find(i => i.groupingCode === 'A.120.01');
        const bankItems = cashAgg.filter(i => i.groupingCode !== 'A.120.01');

        return {
            ...scheduleData,
            cashAndCashEquivalents: {
                ...scheduleData.cashAndCashEquivalents,
                cashOnHand: cashOnHandItem ? cashOnHandItem.amountCy : '0.00',
                balancesWithBanks: bankItems.map(i => ({ ...i })) // Compatible
            }
        };
    }

    // --- PROFIT & LOSS ---

    if (scheduleId === 'revenue') {
        // C.10
        return { ...scheduleData, revenueFromOps: aggregateByGrouping('C.10') };
    }

    if (scheduleId === 'otherIncome') {
        // C.20
        return { ...scheduleData, otherIncome: aggregateByGrouping('C.20') };
    }

    if (scheduleId === 'purchases') {
        // C.40
        return { ...scheduleData, purchases: aggregateByGrouping('C.40') };
    }

    // --- EMPLOYEE BENEFITS (C.60) ---
    if (scheduleId === 'employee') {
        // This one aggregates multiple groupings into specific fields.
        // We can stick to manual aggregation here as it maps to fixed schema fields, not a dynamic list.

        const sumGroup = (code: string) =>
            trialBalanceData
                .filter(i => i.isMapped && i.groupingCode === code)
                .reduce((s, x) => s + x.closingCy, 0);

        // Salaries
        const salaries = sumGroup('C.60.01') + sumGroup('C.60.04') + sumGroup('C.60.07') + sumGroup('C.60.08') + sumGroup('C.60.09');
        const contrib = sumGroup('C.60.02');
        const welfare = sumGroup('C.60.03') + sumGroup('C.60.05') + sumGroup('C.60.06');

        return {
            ...scheduleData,
            employeeBenefits: {
                ...scheduleData.employeeBenefits,
                salariesAndWages: parse(salaries),
                contributionToFunds: parse(contrib),
                staffWelfare: parse(welfare)
            }
        };
    }

    if (scheduleId === 'finance') {
        return { ...scheduleData, financeCosts: aggregateByGrouping('C.70') };
    }

    if (scheduleId === 'otherExpenses') {
        return { ...scheduleData, otherExpenses: aggregateByGrouping('C.90') };
    }

    // --- COGS (Part of C.30) ---
    if (scheduleId === 'cogs') {
        // C.30.01 Opening, C.30.02 Purchase RM, C.30.03 Closing
        // These are typically single groupings, so aggregation acts as finding the total.

        const opening = aggregateByGrouping('C.30.01').map(g => ({ id: g.id, name: g.particular, amountCy: g.amountCy, amountPy: g.amountPy, groupingCode: g.groupingCode }));
        const closing = aggregateByGrouping('C.30.03').map(g => ({ id: g.id, name: g.particular, amountCy: g.amountCy, amountPy: g.amountPy, groupingCode: g.groupingCode }));

        return {
            ...scheduleData,
            costOfMaterialsConsumed: {
                ...scheduleData.costOfMaterialsConsumed,
                opening: opening,
                closing: closing
            }
        };
    }

    // --- CWIP (A.20) ---
    if (scheduleId === 'cwip') {
        const cwipAgg = aggregateByGrouping('A.20');
        const newRows: CWIPRow[] = cwipAgg.map(g => ({
            id: g.id,
            particular: g.particular,
            opening: '0.00',
            additions: g.amountCy,
            capitalized: '0.00',
            closing: g.amountCy
        }));
        return { ...scheduleData, cwip: newRows };
    }

    // --- INTANGIBLES (A.30) ---
    if (scheduleId === 'intangible') {
        // Similar to PPE - Aggregation logic needed for Asset Class
        // Re-using PPE logic roughly
        const assetGroups = new Map<string, { code: string; name: string; cy: number; py: number }>();
        trialBalanceData.forEach(l => {
            if (!l.isMapped || !l.groupingCode?.startsWith('A.30')) return;
            const code = l.groupingCode;
            if (!assetGroups.has(code)) {
                const grouping = masters?.groupings.find(g => g.code === code);
                const name = grouping ? grouping.name : `Asset (${code})`;
                assetGroups.set(code, { code, name, cy: 0, py: 0 });
            }
            const entry = assetGroups.get(code)!;
            entry.cy += l.closingCy;
            entry.py += l.closingPy;
        });

        const newAssets: PpeAssetRow[] = [];
        assetGroups.forEach((val) => {
            newAssets.push({
                id: uuidv4(),
                assetClass: val.name,
                isUnderLease: false,
                grossBlockOpening: parse(val.py),
                grossBlockAdditions: '0', grossBlockDisposals: '0',
                grossBlockClosing: parse(val.cy),
                grossBlockOpeningPy: '0', grossBlockAdditionsPy: '0', grossBlockDisposalsPy: '0',
                depreciationOpening: '0', depreciationForYear: '0', depreciationOnDisposals: '0', depreciationClosing: '0',
                depreciationOpeningPy: '0', depreciationForYearPy: '0', depreciationOnDisposalsPy: '0',
                impairmentLoss: '0', impairmentReversal: '0', impairmentLossPy: '0', impairmentReversalPy: '0',
                netBlockClosing: parse(val.cy)
            });
        });

        return { ...scheduleData, intangibleAssets: { ...scheduleData.intangibleAssets, assets: newAssets } };
    }

    // --- INVESTMENTS (A.50) ---
    if (scheduleId === 'investments') {
        const agg = aggregateByGrouping('A.50');
        const newItems: InvestmentItem[] = agg.map(g => ({
            id: g.id,
            particular: g.particular,
            classification: 'unquoted',
            marketValue: '0.00',
            amountCy: g.amountCy,
            amountPy: g.amountPy,
            basisOfValuation: 'Cost',
            groupingCode: g.groupingCode
        }));
        return { ...scheduleData, investments: { ...scheduleData.investments, items: newItems } };
    }

    // --- CURRENT INVESTMENTS (A.90) ---
    if (scheduleId === 'currentInvestments') {
        const agg = aggregateByGrouping('A.90');
        const newItems: InvestmentItem[] = agg.map(g => ({
            id: g.id,
            particular: g.particular,
            classification: 'quoted',
            marketValue: g.amountCy,
            amountCy: g.amountCy,
            amountPy: g.amountPy,
            basisOfValuation: 'Fair Value',
            groupingCode: g.groupingCode
        }));
        return { ...scheduleData, currentInvestments: { ...scheduleData.currentInvestments, items: newItems } };
    }

    // --- LOANS (A.60) ---
    if (scheduleId === 'longTermLoans') {
        const agg = aggregateByGrouping('A.60');
        const newItems: LoanAdvanceItem[] = agg.map(g => ({
            id: g.id,
            particular: g.particular,
            security: 'unsecured',
            status: 'good',
            amountCy: g.amountCy,
            amountPy: g.amountPy,
            groupingCode: g.groupingCode
        }));
        return { ...scheduleData, loansAndAdvances: { ...scheduleData.loansAndAdvances, items: newItems } };
    }

    // --- SHORT TERM LOANS (A.130) ---
    if (scheduleId === 'shortTermLoans') {
        const agg = aggregateByGrouping('A.130');
        const newItems: LoanAdvanceItem[] = agg.map(g => ({
            id: g.id,
            particular: g.particular,
            security: 'unsecured',
            status: 'good',
            amountCy: g.amountCy,
            amountPy: g.amountPy,
            groupingCode: g.groupingCode
        }));
        return { ...scheduleData, shortTermLoansAndAdvances: { ...scheduleData.shortTermLoansAndAdvances, items: newItems } };
    }

    // --- OTHER NON-CURRENT ASSETS (A.80) ---
    if (scheduleId === 'otherNonCurrentAssets') {
        return { ...scheduleData, otherNonCurrentAssets: aggregateByGrouping('A.80') };
    }

    // --- OTHER CURRENT ASSETS (A.140) ---
    if (scheduleId === 'otherCurrentAssets') {
        return { ...scheduleData, otherCurrentAssets: aggregateByGrouping('A.140') };
    }

    // --- PROVISIONS (B.60 & B.100) ---
    if (scheduleId === 'provisions') {
        const ltAgg = aggregateByGrouping('B.60');
        const stAgg = aggregateByGrouping('B.100');

        const toProv = (g: GenericScheduleItem): ProvisionReconciliationRow => ({
            id: g.id,
            provisionName: g.particular,
            opening: g.amountPy,
            additions: (parseFloat(g.amountCy) - parseFloat(g.amountPy)).toFixed(decimalPlaces),
            usedOrReversed: '0.00',
            closing: g.amountCy,
            groupingCode: g.groupingCode
        });

        return {
            ...scheduleData,
            provisions: {
                longTerm: ltAgg.map(toProv),
                shortTerm: stAgg.map(toProv)
            }
        };
    }

    // --- OTHER LONG TERM LIABILITIES (B.50) ---
    if (scheduleId === 'otherLongTermLiabilities') {
        return { ...scheduleData, otherLongTermLiabilities: aggregateByGrouping('B.50') };
    }

    // --- OTHER CURRENT LIABILITIES (B.90) ---
    if (scheduleId === 'otherCurrentLiabilities') {
        return { ...scheduleData, otherCurrentLiabilities: aggregateByGrouping('B.90') };
    }

    // --- DEFERRED TAX (A.70 / B.40) ---
    if (scheduleId === 'deferredTax') {
        const assetsAgg = aggregateByGrouping('A.70');
        const liabAgg = aggregateByGrouping('B.40');

        const toDef = (g: GenericScheduleItem): DeferredTaxRow => ({
            id: g.id,
            particular: g.particular,
            openingBalance: g.amountPy,
            pnlCharge: '0.00',
            closingBalance: g.amountCy,
            groupingCode: g.groupingCode
        });

        return {
            ...scheduleData,
            deferredTax: {
                assets: assetsAgg.map(toDef),
                liabilities: liabAgg.map(toDef)
            }
        };
    }

    return null;
};
