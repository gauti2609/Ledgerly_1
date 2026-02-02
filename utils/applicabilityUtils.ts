
import { EntityType, EntityInfoData, ScheduleData } from '../types.ts';

export type EntityLevel = 'Level I' | 'Level II' | 'Level III' | 'Level IV' | 'SMC' | 'Non-SMC';

const parseNum = (val: string) => parseFloat(val) || 0;

/**
 * Determines the classification level of the entity based on ICAI criteria.
 * @param entityType - The type of the entity ('Company', 'LLP', 'Non-Corporate').
 * @param entityInfo - The entity information containing turnover and borrowings.
 * @returns The determined entity level.
 */
export const getEntityLevel = (entityType: EntityType | null, entityInfo: EntityInfoData): EntityLevel => {
    // FIX: Handle null entityType gracefully during initial app load.
    if (!entityType) return 'SMC'; // Default to a safe value before selection.

    const turnover = parseNum(entityInfo.turnoverPy) / 10000000; // Convert to Crores
    const borrowings = parseNum(entityInfo.borrowingsPy) / 10000000; // Convert to Crores

    if (entityType === 'Company') {
        // As per Companies (Accounting Standards) Rules, 2021
        const isSMC = 
            turnover <= 250 &&
            borrowings <= 50;
        return isSMC ? 'SMC' : 'Non-SMC';
    }

    // For Non-Corporate Entities (including LLP for this purpose)
    // As per ICAI Announcement on Applicability of AS to Non-company Entities (as on 1.4.2020)
    if (turnover > 250 || borrowings > 50) {
        return 'Level I';
    }
    if (turnover > 50 || borrowings > 10) {
        return 'Level II';
    }
    if (turnover > 10 || borrowings > 2) {
        return 'Level III';
    }
    return 'Level IV';
};


/**
 * Filters the list of notes based on applicability rules for the entity type and level.
 * @param allNotes - The complete list of note selection objects.
 * @param entityType - The type of the entity.
 * @param entityLevel - The classification level of the entity.
 * @returns A filtered array of note selections that are applicable.
 */
export const getApplicableNotes = (
    allNotes: ScheduleData['noteSelections'],
    entityType: EntityType | null,
    entityLevel: EntityLevel
): ScheduleData['noteSelections'] => {
    // FIX: Handle null entityType gracefully during initial app load.
    if (!entityType) return [];
    
    const isMSME = ['Level II', 'Level III', 'Level IV', 'SMC'].includes(entityLevel);

    const rules: Record<string, boolean> = {
        // Always applicable
        'entityInfo': true,
        'acctPolicies': true,
        
        // Entity Type specific
        'companyShareCap': entityType === 'Company',
        'companyOtherEquity': entityType === 'Company',
        'partnersFunds': entityType === 'LLP' || entityType === 'Non-Corporate',
        'eps': entityType === 'Company', // AS 20 is not for non-cos

        // Standard Rules based on Level
        'cash': !isMSME, // AS 3 Cash Flow Statement
        'segmentReporting': !isMSME, // AS 17 Segment Reporting
        'relatedParties': !['Level III', 'Level IV'].includes(entityLevel), // AS 18 not for Level III/IV
        'discontinuingOps': !isMSME, // AS 24 Discontinuing Operations

        // Consolidation related - generally not applicable unless they elect to
        'amalgamations': entityLevel !== 'Level IV', // AS 14 not for Level IV generally
    };

    return allNotes.filter(note => {
        if (note.id in rules) {
            return rules[note.id];
        }
        return true; // Default to applicable if no specific rule
    });
};

/**
 * Checks if a note is mandatory and should be disabled.
 * @param noteId - The ID of the note to check.
 * @returns True if the note is mandatory, false otherwise.
 */
export const isNoteMandatory = (noteId: string): boolean => {
    const mandatoryNotes = ['entityInfo', 'acctPolicies'];
    return mandatoryNotes.includes(noteId);
};
