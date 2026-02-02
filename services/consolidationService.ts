/**
 * Consolidation Service
 * Handles multi-entity consolidation logic for generating consolidated financial statements.
 */

import {
    AllData,
    ConsolidationGroup,
    SubsidiaryConfig,
    InterCompanyElimination,
    ConsolidatedTrialBalanceItem,
    ConsolidatedData,
    MinorityInterest,
    TrialBalanceItem,
    Masters,
    FinancialEntity,
} from '../types.ts';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates an empty ConsolidationGroup with default values.
 */
export function createEmptyConsolidationGroup(
    parentEntity: FinancialEntity
): ConsolidationGroup {
    return {
        id: crypto.randomUUID(),
        name: `${parentEntity.name} Consolidated`,
        parentEntityId: parentEntity.id,
        parentEntityName: parentEntity.name,
        subsidiaries: [],
        eliminations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Creates a new SubsidiaryConfig for an entity.
 */
export function createSubsidiaryConfig(
    entity: FinancialEntity,
    ownershipPercentage: number = 100
): SubsidiaryConfig {
    return {
        entityId: entity.id,
        entityName: entity.name,
        ownershipPercentage,
        isFullyOwned: ownershipPercentage === 100,
        consolidationMethod: ownershipPercentage >= 50 ? 'full' : 'equity',
    };
}

/**
 * Creates a new InterCompanyElimination entry.
 */
export function createElimination(
    description: string,
    eliminationType: InterCompanyElimination['eliminationType'],
    debitGrouping: { code: string; name: string },
    creditGrouping: { code: string; name: string },
    amountCy: number,
    amountPy: number = 0
): InterCompanyElimination {
    return {
        id: crypto.randomUUID(),
        description,
        eliminationType,
        debitGroupingCode: debitGrouping.code,
        debitGroupingName: debitGrouping.name,
        creditGroupingCode: creditGrouping.code,
        creditGroupingName: creditGrouping.name,
        amountCy,
        amountPy,
    };
}

// ============================================================================
// Consolidation Logic
// ============================================================================

interface EntityData {
    entity: FinancialEntity;
    data: AllData;
    ownershipPct: number; // 100 for parent
}

/**
 * Aggregates trial balance data from multiple entities into consolidated line items.
 * Groups by groupingCode and sums amounts, applying ownership percentage for proportionate consolidation.
 */
export function consolidateTrialBalances(
    entitiesData: EntityData[],
    masters: Masters
): ConsolidatedTrialBalanceItem[] {
    // Map to aggregate by groupingCode
    const consolidatedMap = new Map<string, ConsolidatedTrialBalanceItem>();

    for (const { entity, data, ownershipPct } of entitiesData) {
        const consolidationFactor = ownershipPct / 100;

        for (const item of data.trialBalanceData) {
            if (!item.isMapped || !item.groupingCode) continue;

            const existing = consolidatedMap.get(item.groupingCode);

            // Find grouping, minor head, and major head names
            const grouping = masters.groupings.find(g => g.code === item.groupingCode);
            const minorHead = masters.minorHeads.find(m => m.code === item.minorHeadCode);
            const majorHead = masters.majorHeads.find(m => m.code === item.majorHeadCode);

            const entityBreakdown = {
                entityId: entity.id,
                entityName: entity.name,
                amountCy: item.closingCy * consolidationFactor,
                amountPy: item.closingPy * consolidationFactor,
            };

            if (existing) {
                existing.closingCy += item.closingCy * consolidationFactor;
                existing.closingPy += item.closingPy * consolidationFactor;
                existing.consolidatedCy = existing.closingCy - existing.eliminationCy;
                existing.consolidatedPy = existing.closingPy - existing.eliminationPy;
                existing.entityBreakdown.push(entityBreakdown);
            } else {
                consolidatedMap.set(item.groupingCode, {
                    groupingCode: item.groupingCode,
                    groupingName: grouping?.name || item.groupingCode,
                    minorHeadCode: item.minorHeadCode || '',
                    minorHeadName: minorHead?.name || '',
                    majorHeadCode: item.majorHeadCode || '',
                    majorHeadName: majorHead?.name || '',
                    closingCy: item.closingCy * consolidationFactor,
                    closingPy: item.closingPy * consolidationFactor,
                    eliminationCy: 0,
                    eliminationPy: 0,
                    consolidatedCy: item.closingCy * consolidationFactor,
                    consolidatedPy: item.closingPy * consolidationFactor,
                    entityBreakdown: [entityBreakdown],
                });
            }
        }
    }

    return Array.from(consolidatedMap.values()).sort((a, b) =>
        a.groupingCode.localeCompare(b.groupingCode)
    );
}

/**
 * Applies inter-company eliminations to the consolidated trial balance.
 * Debit entries reduce the consolidated amount, credit entries increase it.
 */
export function applyEliminations(
    consolidatedTB: ConsolidatedTrialBalanceItem[],
    eliminations: InterCompanyElimination[]
): ConsolidatedTrialBalanceItem[] {
    const tbMap = new Map(consolidatedTB.map(item => [item.groupingCode, { ...item }]));

    for (const elim of eliminations) {
        // Apply debit (reduce)
        const debitItem = tbMap.get(elim.debitGroupingCode);
        if (debitItem) {
            debitItem.eliminationCy += elim.amountCy;
            debitItem.eliminationPy += elim.amountPy;
            debitItem.consolidatedCy = debitItem.closingCy - debitItem.eliminationCy;
            debitItem.consolidatedPy = debitItem.closingPy - debitItem.eliminationPy;
        }

        // Apply credit (reduce - for liabilities/equity, reducing is correct)
        const creditItem = tbMap.get(elim.creditGroupingCode);
        if (creditItem) {
            creditItem.eliminationCy += elim.amountCy;
            creditItem.eliminationPy += elim.amountPy;
            creditItem.consolidatedCy = creditItem.closingCy - creditItem.eliminationCy;
            creditItem.consolidatedPy = creditItem.closingPy - creditItem.eliminationPy;
        }
    }

    return Array.from(tbMap.values());
}

/**
 * Calculates minority interest for partially owned subsidiaries.
 * Minority interest = (100% - ownership%) * subsidiary's equity/profit
 */
export function calculateMinorityInterests(
    subsidiaries: SubsidiaryConfig[],
    entitiesData: EntityData[]
): MinorityInterest[] {
    const minorityInterests: MinorityInterest[] = [];

    for (const sub of subsidiaries) {
        if (sub.isFullyOwned) continue; // No minority for 100% owned

        const entityData = entitiesData.find(e => e.entity.id === sub.entityId);
        if (!entityData) continue;

        const minorityPct = 100 - sub.ownershipPercentage;

        // Calculate equity from trial balance (simplified - equity accounts start with B.10, B.20)
        let equityCy = 0;
        let equityPy = 0;
        let profitCy = 0;
        let profitPy = 0;

        for (const item of entityData.data.trialBalanceData) {
            if (!item.isMapped || !item.majorHeadCode) continue;

            // Equity accounts (Major Head B - Equity & Liabilities, Minor Head for Capital)
            if (item.majorHeadCode === 'B' && item.minorHeadCode?.startsWith('B.10')) {
                equityCy += item.closingCy;
                equityPy += item.closingPy;
            }

            // P&L items for profit calculation (simplified)
            if (item.majorHeadCode === 'C') {
                // Income reduces liability (credit balance)
                if (item.minorHeadCode?.startsWith('C.10') || item.minorHeadCode?.startsWith('C.20')) {
                    profitCy += item.closingCy;
                    profitPy += item.closingPy;
                }
                // Expenses reduce profit
                if (item.minorHeadCode?.startsWith('C.30') || item.minorHeadCode?.startsWith('C.40') ||
                    item.minorHeadCode?.startsWith('C.50') || item.minorHeadCode?.startsWith('C.60')) {
                    profitCy -= item.closingCy;
                    profitPy -= item.closingPy;
                }
            }
        }

        minorityInterests.push({
            entityId: sub.entityId,
            entityName: sub.entityName,
            ownershipPercentage: sub.ownershipPercentage,
            minorityPct,
            equityCy: equityCy * (minorityPct / 100),
            equityPy: equityPy * (minorityPct / 100),
            profitCy: profitCy * (minorityPct / 100),
            profitPy: profitPy * (minorityPct / 100),
        });
    }

    return minorityInterests;
}

/**
 * Main consolidation function that orchestrates the entire process.
 */
export function generateConsolidatedData(
    group: ConsolidationGroup,
    parentEntity: FinancialEntity,
    parentData: AllData,
    subsidiaryEntities: FinancialEntity[],
    subsidiaryDataMap: Map<string, AllData>
): ConsolidatedData {
    // Prepare entities data array
    const entitiesData: EntityData[] = [
        { entity: parentEntity, data: parentData, ownershipPct: 100 },
    ];

    for (const sub of group.subsidiaries) {
        const entity = subsidiaryEntities.find(e => e.id === sub.entityId);
        const data = subsidiaryDataMap.get(sub.entityId);
        if (entity && data) {
            entitiesData.push({
                entity,
                data,
                ownershipPct: sub.consolidationMethod === 'full' ? 100 : sub.ownershipPercentage,
            });
        }
    }

    // Use parent's masters as the base
    const masters = parentData.masters;

    // Step 1: Consolidate trial balances
    let consolidatedTB = consolidateTrialBalances(entitiesData, masters);

    // Step 2: Apply eliminations
    consolidatedTB = applyEliminations(consolidatedTB, group.eliminations);

    // Step 3: Calculate minority interests
    const minorityInterests = calculateMinorityInterests(group.subsidiaries, entitiesData);

    // Step 4: Calculate summary totals
    let totalAssetsCy = 0, totalAssetsPy = 0;
    let totalLiabilitiesCy = 0, totalLiabilitiesPy = 0;
    let totalRevenueCy = 0, totalRevenuePy = 0;
    let totalExpensesCy = 0, totalExpensesPy = 0;

    for (const item of consolidatedTB) {
        // Assets (Major Head A)
        if (item.majorHeadCode === 'A') {
            totalAssetsCy += item.consolidatedCy;
            totalAssetsPy += item.consolidatedPy;
        }
        // Liabilities & Equity (Major Head B)
        if (item.majorHeadCode === 'B') {
            totalLiabilitiesCy += item.consolidatedCy;
            totalLiabilitiesPy += item.consolidatedPy;
        }
        // Revenue (Major Head C, specific minor heads)
        if (item.majorHeadCode === 'C' &&
            (item.minorHeadCode.startsWith('C.10') || item.minorHeadCode.startsWith('C.20'))) {
            totalRevenueCy += item.consolidatedCy;
            totalRevenuePy += item.consolidatedPy;
        }
        // Expenses
        if (item.majorHeadCode === 'C' &&
            !item.minorHeadCode.startsWith('C.10') && !item.minorHeadCode.startsWith('C.20')) {
            totalExpensesCy += item.consolidatedCy;
            totalExpensesPy += item.consolidatedPy;
        }
    }

    return {
        groupId: group.id,
        groupName: group.name,
        consolidatedTB,
        minorityInterests,
        totalAssetsCy,
        totalAssetsPy,
        totalLiabilitiesCy,
        totalLiabilitiesPy,
        totalRevenueCy,
        totalRevenuePy,
        netProfitCy: totalRevenueCy - totalExpensesCy,
        netProfitPy: totalRevenuePy - totalExpensesPy,
    };
}

// ============================================================================
// Suggested Eliminations (Auto-Detection)
// ============================================================================

/**
 * Suggests common inter-company eliminations based on related party flags.
 * Returns suggestions that user can review and approve.
 */
export function suggestEliminationsFromRelatedParty(
    entitiesData: EntityData[],
    masters: Masters
): InterCompanyElimination[] {
    const suggestions: InterCompanyElimination[] = [];

    // Find all ledgers marked as related party
    const relatedPartyLedgers: { entity: FinancialEntity; item: TrialBalanceItem }[] = [];

    for (const { entity, data } of entitiesData) {
        for (const item of data.trialBalanceData) {
            if (item.attributes?.isRelatedParty && item.isMapped) {
                relatedPartyLedgers.push({ entity, item });
            }
        }
    }

    // Look for matching receivable/payable pairs
    const receivables = relatedPartyLedgers.filter(
        l => l.item.minorHeadCode?.includes('A.110') || l.item.minorHeadCode?.includes('A.120')
    );
    const payables = relatedPartyLedgers.filter(
        l => l.item.minorHeadCode?.includes('B.70') || l.item.minorHeadCode?.includes('B.80')
    );

    // Simple matching: if amounts match, suggest elimination
    for (const rec of receivables) {
        for (const pay of payables) {
            if (rec.entity.id !== pay.entity.id &&
                Math.abs(rec.item.closingCy) === Math.abs(pay.item.closingCy)) {
                const recGrouping = masters.groupings.find(g => g.code === rec.item.groupingCode);
                const payGrouping = masters.groupings.find(g => g.code === pay.item.groupingCode);

                suggestions.push(createElimination(
                    `Inter-company: ${rec.entity.name} ↔ ${pay.entity.name}`,
                    'receivable-payable',
                    { code: rec.item.groupingCode || '', name: recGrouping?.name || '' },
                    { code: pay.item.groupingCode || '', name: payGrouping?.name || '' },
                    Math.abs(rec.item.closingCy),
                    Math.abs(rec.item.closingPy)
                ));
            }
        }
    }

    return suggestions;
}
