
import React, { useState, useEffect } from 'react';
import { TrialBalanceTable } from './TrialBalanceTable.tsx';
import { MappedLedgersTable } from './MappedLedgersTable.tsx';
import { MappingPanel } from './MappingPanel.tsx';
import { TrialBalanceItem, Masters, AllData, Role, LedgerAttributes } from '../types.ts';
import { ImportModal } from './ImportModal.tsx';
import { MastersModal } from './MastersModal.tsx';
import { ValidationPanel } from './ValidationPanel.tsx';
import { UploadIcon, CogIcon, WandIcon, CheckCircleIcon, FunnelIcon, DownloadIcon, ShieldCheckIcon } from './icons.tsx';
import { exportMappedLedgersToExcel, exportMastersToExcel, exportUnmappedLedgersToExcel } from '../services/exportService.ts';
import * as geminiService from '../services/geminiService.ts';
import { runAllValidations, ValidationResult } from '../services/validationService.ts';

interface MappingWorkbenchProps {
    allData: AllData;
    setTrialBalanceData: React.Dispatch<React.SetStateAction<TrialBalanceItem[]>>;
    onImport: (data: Omit<TrialBalanceItem, 'id' | 'isMapped' | 'majorHeadCode' | 'minorHeadCode' | 'groupingCode'>[]) => void;
    masters: Masters;
    setMasters: (masters: Masters) => void;
    onAddLineItem: (noteId: string, name: string) => void;
    token: string;
    role: Role | null;
}

export const MappingWorkbench: React.FC<MappingWorkbenchProps> = ({ allData, setTrialBalanceData, onImport, masters, setMasters, onAddLineItem, token, role }) => {
    const { trialBalanceData, scheduleData } = allData;
    const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(null);
    const [selectedLedgerIds, setSelectedLedgerIds] = useState<Set<string>>(new Set());
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isMastersModalOpen, setMastersModalOpen] = useState(false);

    // Batch Manual Mapping State
    const [batchMajorHead, setBatchMajorHead] = useState('');
    const [batchMinorHead, setBatchMinorHead] = useState('');
    const [batchGrouping, setBatchGrouping] = useState('');
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    // New: Selective Approval State
    const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<string>>(new Set());
    // New: Mapped ledger selection for bulk re-mapping
    const [selectedMappedIds, setSelectedMappedIds] = useState<Set<string>>(new Set());
    // New: AI suggestions for mapped ledgers (for re-mapping)
    const [mappedSuggestions, setMappedSuggestions] = useState<Record<string, any>>({});
    const [selectedMappedSuggestionIds, setSelectedMappedSuggestionIds] = useState<Set<string>>(new Set());

    // Validation State
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMajorHead, setFilterMajorHead] = useState('');
    const [filterMinorHead, setFilterMinorHead] = useState('');
    const [filterGrouping, setFilterGrouping] = useState('');

    const unmappedLedgers = trialBalanceData.filter(item => !item.isMapped);
    const filteredUnmappedLedgers = unmappedLedgers.filter(item => {
        const matchesSearch = item.ledger.toLowerCase().includes(searchTerm.toLowerCase());

        // For filters, we check if the item matches. If it's unmapped, it won't have codes, 
        // BUT if it has suggestions, maybe we filter by suggestion? 
        // OR the user wants to filter by "Unmapped but suggested"?
        // Typically filters on unmapped list are tricky if items have no data.
        // The user requirement "visualize data by selecting..." suggests they want to filter 
        // the list. If items are unmapped, filtering by MajorHead is impossible unless
        // we filter by SUGGESTED MajorHead.
        // Let's assume strict filtering: If item is unmapped, it might not match.
        // However, if the user Bulk-Mapped a batch but didn't Approve yet, they have suggestions.
        // So let's filter by Suggested codes if present, otherwise ignore?
        // Actually, simpler interpretation: The filters might be for the Mapped table?
        // "There should be drop-downs on the top for the user to visualize data... this shall enhance the user bulk edit function"
        // Bulk edit usually implies changing ALREADY mapped items or applying mapping to NEW items.
        // If items are unmapped, they have no head.
        // Let's support filtering by Suggested Heads if available.

        const matchesMajor = !filterMajorHead || (item.suggestedMajorHeadCode === filterMajorHead || item.majorHeadCode === filterMajorHead);
        const matchesMinor = !filterMinorHead || (item.suggestedMinorHeadCode === filterMinorHead || item.minorHeadCode === filterMinorHead);
        const matchesGrouping = !filterGrouping || (item.suggestedGroupingCode === filterGrouping || item.groupingCode === filterGrouping);

        return matchesSearch && matchesMajor && matchesMinor && matchesGrouping;
    });

    const mappedLedgers = trialBalanceData.filter(item => item.isMapped);

    // Apply filters to mapped ledgers
    const filteredMappedLedgers = mappedLedgers.filter(item => {
        const matchesMajor = !filterMajorHead || item.majorHeadCode === filterMajorHead;
        const matchesMinor = !filterMinorHead || item.minorHeadCode === filterMinorHead;
        const matchesGrouping = !filterGrouping || item.groupingCode === filterGrouping;
        return matchesMajor && matchesMinor && matchesGrouping;
    });

    // Smart merge for updated Trial Balance imports
    const handleImportWithAI = async (newData: Omit<TrialBalanceItem, 'id' | 'isMapped' | 'majorHeadCode' | 'minorHeadCode' | 'groupingCode'>[]) => {
        const existingLedgers = trialBalanceData;
        const existingByName = new Map<string, TrialBalanceItem>(existingLedgers.map(l => [l.ledger.toLowerCase().trim(), l]));
        const newByName = new Map<string, typeof newData[0]>(newData.map(l => [l.ledger.toLowerCase().trim(), l]));

        // Categorize ledgers
        const updated: TrialBalanceItem[] = [];
        const newLedgers: typeof newData = [];
        const missing: TrialBalanceItem[] = [];

        // Find updated and new ledgers
        for (const item of newData) {
            const key = item.ledger.toLowerCase().trim();
            const existing = existingByName.get(key);
            if (existing) {
                // Ledger exists - update balances, preserve mapping
                updated.push({
                    ...existing,
                    closingCy: item.closingCy,
                    closingPy: item.closingPy,
                    noteLineItemId: item.noteLineItemId ?? existing.noteLineItemId
                });
            } else {
                // New ledger
                newLedgers.push(item);
            }
        }

        // Find missing ledgers (in old but not in new)
        for (const existing of existingLedgers) {
            const key = existing.ledger.toLowerCase().trim();
            if (!newByName.has(key)) {
                missing.push(existing);
            }
        }

        // Log merge summary
        console.log(`[TB Merge] Updated: ${updated.length}, New: ${newLedgers.length}, Missing: ${missing.length}`);

        // Build merged data: updated + missing (keep them) + new items
        const mergedData: TrialBalanceItem[] = [
            ...updated,
            ...missing, // Keep missing ledgers (user can delete manually if needed)
        ];

        // Add new ledgers with generated IDs
        const newItems: TrialBalanceItem[] = newLedgers.map((item, i) => ({
            id: `new-${Date.now()}-${i}`,
            ledger: item.ledger,
            closingCy: item.closingCy,
            closingPy: item.closingPy,
            noteLineItemId: item.noteLineItemId ?? null,
            isMapped: false,
            majorHeadCode: undefined,
            minorHeadCode: undefined,
            groupingCode: undefined
        } as TrialBalanceItem));

        // Update state with merged data
        setTrialBalanceData([...mergedData, ...newItems]);

        // Only run AI suggestions on NEW unmapped ledgers (chunked for large imports)
        if (newLedgers.length > 0) {
            setIsBatchProcessing(true);
            const CHUNK_SIZE = 25; // Process 25 ledgers at a time for reliability
            const allSuggestions: Record<string, any> = {};

            // Process in chunks
            for (let i = 0; i < newLedgers.length; i += CHUNK_SIZE) {
                const chunk = newLedgers.slice(i, i + CHUNK_SIZE);
                const ledgersWithBalance = chunk.map(l => ({ name: l.ledger, balance: l.closingCy }));

                console.log(`[TB Import] Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(newLedgers.length / CHUNK_SIZE)} (${chunk.length} ledgers)`);

                try {
                    const chunkSuggestions = await geminiService.getBatchMappingSuggestions(token, ledgersWithBalance, masters);
                    if (chunkSuggestions) {
                        Object.assign(allSuggestions, chunkSuggestions);
                    }
                } catch (err) {
                    console.error(`[TB Import] Chunk ${Math.floor(i / CHUNK_SIZE) + 1} failed:`, err);
                }

                // Update UI progressively after each chunk
                if (Object.keys(allSuggestions).length > 0) {
                    setTrialBalanceData(prev => prev.map(item => {
                        const sugg = allSuggestions[item.ledger];
                        if (sugg && !item.isMapped && !item.suggestedMajorHeadCode) {
                            return {
                                ...item,
                                suggestedMajorHeadCode: sugg.majorHeadCode,
                                suggestedMinorHeadCode: sugg.minorHeadCode,
                                suggestedGroupingCode: sugg.groupingCode,
                                suggestionConfidence: sugg.confidence,
                                suggestionReasoning: sugg.reasoning
                            };
                        }
                        return item;
                    }));
                }
            }

            console.log(`[TB Import] Completed. Total suggestions: ${Object.keys(allSuggestions).length}`);
            setIsBatchProcessing(false);
        } else {
            console.log('[TB Import] No new ledgers to process');
        }

        // Show summary notification (via alert for now)
        const summary = [
            updated.length > 0 ? `✓ ${updated.length} ledgers updated (balances refreshed, mappings preserved)` : null,
            newLedgers.length > 0 ? `+ ${newLedgers.length} new ledgers added (AI suggestions running...)` : null,
            missing.length > 0 ? `⚠ ${missing.length} ledgers not in new file (kept with existing data)` : null
        ].filter(Boolean).join('\n');

        if (summary) {
            setTimeout(() => alert(`Trial Balance Merge Summary:\n\n${summary}`), 100);
        }
    };

    // Retry AI suggestions for unmapped ledgers that are creating issues or missing suggestions
    const handleGetMissingSuggestions = async () => {
        const missingSuggestions = unmappedLedgers.filter(l => !l.suggestedMajorHeadCode);

        if (missingSuggestions.length === 0) {
            alert('All unmapped ledgers already have suggestions.');
            return;
        }

        setIsBatchProcessing(true);
        const CHUNK_SIZE = 25;
        const allSuggestions: Record<string, any> = {};

        console.log(`[Retry AI] Found ${missingSuggestions.length} ledgers without suggestions. Processing...`);

        for (let i = 0; i < missingSuggestions.length; i += CHUNK_SIZE) {
            const chunk = missingSuggestions.slice(i, i + CHUNK_SIZE);
            const ledgersWithBalance = chunk.map(l => ({ name: l.ledger, balance: l.closingCy }));

            console.log(`[Retry AI] Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(missingSuggestions.length / CHUNK_SIZE)} (${chunk.length} ledgers)`);

            try {
                const chunkSuggestions = await geminiService.getBatchMappingSuggestions(token, ledgersWithBalance, masters);
                if (chunkSuggestions) {
                    Object.assign(allSuggestions, chunkSuggestions);
                }
            } catch (err) {
                console.error(`[Retry AI] Chunk ${Math.floor(i / CHUNK_SIZE) + 1} failed:`, err);
            }

            // Update UI progressively
            if (Object.keys(allSuggestions).length > 0) {
                setTrialBalanceData(prev => prev.map(item => {
                    const sugg = allSuggestions[item.ledger];
                    if (sugg && !item.isMapped && !item.suggestedMajorHeadCode) {
                        return {
                            ...item,
                            suggestedMajorHeadCode: sugg.majorHeadCode,
                            suggestedMinorHeadCode: sugg.minorHeadCode,
                            suggestedGroupingCode: sugg.groupingCode,
                            suggestionConfidence: sugg.confidence,
                            suggestionReasoning: sugg.reasoning
                        };
                    }
                    return item;
                }));
            }
        }
        setIsBatchProcessing(false);
        alert(`AI Suggestions updated for ${Object.keys(allSuggestions).length} ledgers.`);
        alert(`AI Suggestions updated for ${Object.keys(allSuggestions).length} ledgers.`);
    };

    // Bulk Actions for Trial Balance Table
    const handleBulkApprove = () => {
        let approvedCount = 0;
        setTrialBalanceData(prev => prev.map(item => {
            if (selectedLedgerIds.has(item.id)) {
                // Only approve if it has valid suggestions
                if (item.suggestedMajorHeadCode && item.suggestedMinorHeadCode && item.suggestedGroupingCode) {
                    approvedCount++;
                    return {
                        ...item,
                        isMapped: true,
                        majorHeadCode: item.suggestedMajorHeadCode,
                        minorHeadCode: item.suggestedMinorHeadCode,
                        groupingCode: item.suggestedGroupingCode
                    };
                }
            }
            return item;
        }));
        setSelectedLedgerIds(new Set());
        if (approvedCount > 0) {
            // Optional: alert or toast
            console.log(`Approved ${approvedCount} ledgers.`);
        }
    };

    const handleBulkReject = () => {
        setTrialBalanceData(prev => prev.map(item => {
            if (selectedLedgerIds.has(item.id)) {
                return {
                    ...item,
                    suggestedMajorHeadCode: undefined,
                    suggestedMinorHeadCode: undefined,
                    suggestedGroupingCode: undefined,
                    suggestionConfidence: undefined
                };
            }
            return item;
        }));
        setSelectedLedgerIds(new Set());
    };

    // specialized effect to sync sidebar selection with main table selection
    useEffect(() => {
        // When checking items in the main table, also check them in the sidebar (suggestion review)
        setSelectedSuggestionIds(new Set(selectedLedgerIds));
    }, [selectedLedgerIds]);

    const handleSelectLedger = (id: string) => {
        setSelectedLedgerId(id);
    };

    const handleToggleSelection = (id: string, shiftKey: boolean) => {
        const newSet = new Set(selectedLedgerIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedLedgerIds(newSet);
    };

    const handleSelectAll = (select: boolean) => {
        if (select) {
            setSelectedLedgerIds(new Set(filteredUnmappedLedgers.map(l => l.id)));
        } else {
            setSelectedLedgerIds(new Set());
        }
    };

    // Handlers for mapped ledger selection
    const handleToggleMappedSelection = (id: string) => {
        const newSet = new Set(selectedMappedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedMappedIds(newSet);
    };

    const handleSelectAllMapped = (select: boolean) => {
        if (select) {
            setSelectedMappedIds(new Set(mappedLedgers.map(l => l.id)));
        } else {
            setSelectedMappedIds(new Set());
        }
    };

    const handleBulkRemapMapped = () => {
        if (!batchMajorHead || !batchMinorHead || !batchGrouping) return;
        setTrialBalanceData(prev => prev.map(item => {
            if (selectedMappedIds.has(item.id)) {
                return {
                    ...item,
                    majorHeadCode: batchMajorHead,
                    minorHeadCode: batchMinorHead,
                    groupingCode: batchGrouping,
                    noteLineItemId: null
                };
            }
            return item;
        }));
        setSelectedMappedIds(new Set());
        setBatchMajorHead('');
        setBatchMinorHead('');
        setBatchGrouping('');
    };

    // Handler for AI suggestions on MAPPED ledgers
    const handleMappedAiSuggest = async () => {
        setIsBatchProcessing(true);
        const mappedToProcess = trialBalanceData.filter(l => selectedMappedIds.has(l.id));
        const ledgersWithBalance = mappedToProcess.map(l => ({ name: l.ledger, balance: l.closingCy }));

        const suggestions = await geminiService.getBatchMappingSuggestions(token, ledgersWithBalance, masters);

        if (suggestions) {
            setMappedSuggestions(suggestions);
            // Auto-select all valid suggestions
            const validIds = Array.from(selectedMappedIds).filter(id => {
                const item = trialBalanceData.find(l => l.id === id);
                return item && suggestions[item.ledger] && !(suggestions[item.ledger] as any).error;
            });
            setSelectedMappedSuggestionIds(new Set(validIds));
        }
        setIsBatchProcessing(false);
    };

    // Handler to apply AI suggestions to MAPPED ledgers
    const handleApplyMappedSuggestions = () => {
        setTrialBalanceData(prev => prev.map(item => {
            if (selectedMappedSuggestionIds.has(item.id) && mappedSuggestions[item.ledger]) {
                const s = mappedSuggestions[item.ledger];
                if (!(s as any).error) {
                    return {
                        ...item,
                        majorHeadCode: s.majorHeadCode,
                        minorHeadCode: s.minorHeadCode,
                        groupingCode: s.groupingCode,
                        noteLineItemId: null,
                        suggestionReasoning: s.reasoning
                    };
                }
            }
            return item;
        }));
        setSelectedMappedIds(new Set());
        setMappedSuggestions({});
        setSelectedMappedSuggestionIds(new Set());
    };

    const handleMapLedger = (ledgerId: string, mapping: { majorHeadCode: string; minorHeadCode: string; groupingCode: string, noteLineItemId: string | null }) => {
        setTrialBalanceData(prev => prev.map(item => item.id === ledgerId ? {
            ...item,
            isMapped: true,
            ...mapping,
            // Clear suggestions on map
            suggestedMajorHeadCode: undefined,
            suggestedMinorHeadCode: undefined,
            suggestedGroupingCode: undefined,
            suggestionConfidence: undefined
        } : item));
        setSelectedLedgerId(null);
    };

    const handleBatchMap = () => {
        if (!batchMajorHead || !batchMinorHead || !batchGrouping) return;

        setTrialBalanceData(prev => prev.map(item => {
            if (selectedLedgerIds.has(item.id)) {
                return {
                    ...item,
                    isMapped: true,
                    majorHeadCode: batchMajorHead,
                    minorHeadCode: batchMinorHead,
                    groupingCode: batchGrouping,
                    noteLineItemId: null,
                    suggestedMajorHeadCode: undefined,
                    suggestedMinorHeadCode: undefined,
                    suggestedGroupingCode: undefined,
                    suggestionConfidence: undefined
                };
            }
            return item;
        }));
        setSelectedLedgerIds(new Set());
        setBatchMajorHead('');
        setBatchMinorHead('');
        setBatchGrouping('');
    };

    const handleBatchAiSuggest = async () => {
        setIsBatchProcessing(true);
        const ledgersToProcess = unmappedLedgers.filter(l => selectedLedgerIds.has(l.id));
        // Send ledger objects with name and balance for AI classification
        const ledgersWithBalance = ledgersToProcess.map(l => ({ name: l.ledger, balance: l.closingCy }));

        console.log('[DEBUG] Requesting suggestions for:', ledgersWithBalance);

        console.log('[DEBUG] Requesting suggestions for:', ledgersWithBalance);

        const suggestions = await geminiService.getBatchMappingSuggestions(token, ledgersWithBalance, masters);

        console.log('[DEBUG] Received suggestions:', suggestions);

        if (suggestions) {
            const newSelection = new Set<string>();
            setTrialBalanceData(prev => prev.map(item => {
                if (selectedLedgerIds.has(item.id) && suggestions[item.ledger]) {
                    const s = suggestions[item.ledger];
                    console.log('[DEBUG] Mapping item:', item.ledger, 'to suggestion:', s);
                    newSelection.add(item.id); // Auto-select valid suggestions
                    return {
                        ...item,
                        // DO NOT set isMapped: true. Just populate suggestions.
                        suggestedMajorHeadCode: s.majorHeadCode,
                        suggestedMinorHeadCode: s.minorHeadCode,
                        suggestedGroupingCode: s.groupingCode,
                        suggestionConfidence: s.confidence
                    };
                }
                return item;
            }));
            setSelectedSuggestionIds(newSelection);
            console.log('[DEBUG] Selected suggestion IDs:', Array.from(newSelection));
        } else {
            console.log('[DEBUG] Suggestions is null/undefined');
        }
        setIsBatchProcessing(false);
    };

    const handleBatchApprove = () => {
        setTrialBalanceData(prev => prev.map(item => {
            // Only approve if selected in BOTH main list AND suggestion check list
            if (selectedLedgerIds.has(item.id) && selectedSuggestionIds.has(item.id) && item.suggestedMajorHeadCode) {
                return {
                    ...item,
                    isMapped: true,
                    majorHeadCode: item.suggestedMajorHeadCode!,
                    minorHeadCode: item.suggestedMinorHeadCode!,
                    groupingCode: item.suggestedGroupingCode!,
                    noteLineItemId: null,
                    suggestedMajorHeadCode: undefined, // Clear suggestion after approval
                    suggestedMinorHeadCode: undefined,
                    suggestedGroupingCode: undefined,
                    suggestionConfidence: undefined
                };
            }
            return item;
        }));

        // Remove approved items from main selection
        const newSelectedLedgers = new Set(selectedLedgerIds);
        selectedSuggestionIds.forEach(id => newSelectedLedgers.delete(id));
        setSelectedLedgerIds(newSelectedLedgers);

        setSelectedSuggestionIds(new Set());
    };

    const handleToggleSuggestion = (id: string) => {
        const newSet = new Set(selectedSuggestionIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedSuggestionIds(newSet);
    };

    const handleClearSuggestions = () => {
        setTrialBalanceData(prev => prev.map(item => {
            if (selectedLedgerIds.has(item.id)) {
                return {
                    ...item,
                    suggestedMajorHeadCode: undefined,
                    suggestedMinorHeadCode: undefined,
                    suggestedGroupingCode: undefined,
                    suggestionConfidence: undefined
                };
            }
            return item;
        }));
        setSelectedLedgerIds(new Set());
    };

    useEffect(() => {
        const itemExists = trialBalanceData.find(l => l.id === selectedLedgerId);
        if (selectedLedgerId && !itemExists) {
            // If selected ledger disappears completely (deleted?), deselect.
            // We now ALLOW selecting mapped ledgers, so we don't check !item.isMapped here.
            setSelectedLedgerId(null);
        }
    }, [trialBalanceData, selectedLedgerId]);

    const selectedLedger = trialBalanceData.find(l => l.id === selectedLedgerId);

    const batchAvailableMinorHeads = masters.minorHeads.filter(mh => mh.majorHeadCode === batchMajorHead);
    const batchAvailableGroupings = masters.groupings.filter(g => g.minorHeadCode === batchMinorHead);

    // Bidirectional filter logic - allow selection from any dropdown first
    // If grouping selected, filter minorHeads to those containing this grouping, and majorHeads to those containing these minorHeads
    // If minorHead selected, filter groupings to those in this minorHead, and majorHeads to those containing this minorHead
    // If majorHead selected, filter minorHeads to those in this majorHead, and groupings to those in selected minorHeads

    const filterAvailableGroupings = (() => {
        if (filterMinorHead) return masters.groupings.filter(g => g.minorHeadCode === filterMinorHead);
        if (filterMajorHead) {
            const minorsInMajor = masters.minorHeads.filter(m => m.majorHeadCode === filterMajorHead).map(m => m.code);
            return masters.groupings.filter(g => minorsInMajor.includes(g.minorHeadCode));
        }
        return masters.groupings;
    })();

    const filterAvailableMinorHeads = (() => {
        if (filterGrouping) {
            const grouping = masters.groupings.find(g => g.code === filterGrouping);
            return grouping ? masters.minorHeads.filter(m => m.code === grouping.minorHeadCode) : masters.minorHeads;
        }
        if (filterMajorHead) return masters.minorHeads.filter(m => m.majorHeadCode === filterMajorHead);
        return masters.minorHeads;
    })();

    const filterAvailableMajorHeads = (() => {
        if (filterGrouping) {
            const grouping = masters.groupings.find(g => g.code === filterGrouping);
            if (grouping) {
                const minor = masters.minorHeads.find(m => m.code === grouping.minorHeadCode);
                return minor ? masters.majorHeads.filter(mh => mh.code === minor.majorHeadCode) : masters.majorHeads;
            }
        }
        if (filterMinorHead) {
            const minor = masters.minorHeads.find(m => m.code === filterMinorHead);
            return minor ? masters.majorHeads.filter(mh => mh.code === minor.majorHeadCode) : masters.majorHeads;
        }
        return masters.majorHeads;
    })();

    const activeSuggestionsCount = Array.from(selectedLedgerIds).filter(id => {
        const item = trialBalanceData.find(l => l.id === id);
        return item && item.suggestedMajorHeadCode;
    }).length;

    const handleUnmapLedger = (ledgerId: string) => {
        setTrialBalanceData(prev => prev.map(item => item.id === ledgerId ? {
            ...item,
            isMapped: false,
            majorHeadCode: undefined, // Clear mapped values
            minorHeadCode: undefined,
            groupingCode: undefined,
            // Restore suggestions if available, so user can easily map again
            suggestedMajorHeadCode: item.majorHeadCode || item.suggestedMajorHeadCode,
            suggestedMinorHeadCode: item.minorHeadCode || item.suggestedMinorHeadCode,
            suggestedGroupingCode: item.groupingCode || item.suggestedGroupingCode,
        } : item));
        setSelectedLedgerIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(ledgerId);
            return newSet;
        });
        setSelectedMappedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(ledgerId);
            return newSet;
        });
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-4">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mapping Workbench</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Map trial balance ledgers to the financial statement structure.</p>
                </div>
                <div className="flex items-center space-x-2">
                    {role !== 'VIEWER' && (
                        <>
                            <button onClick={handleGetMissingSuggestions} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm mr-2" disabled={isBatchProcessing}>
                                <WandIcon className={`w-4 h-4 mr-2 ${isBatchProcessing ? 'animate-spin' : ''}`} />
                                {isBatchProcessing ? 'Processing...' : 'Get Missing Suggestions'}
                            </button>
                            <button onClick={() => setImportModalOpen(true)} className="flex items-center bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white border border-gray-300 dark:border-transparent font-bold py-2 px-4 rounded-md transition-colors text-sm mr-2">
                                <UploadIcon className="w-4 h-4 mr-2" />
                                Import Trial Balance
                            </button>
                            <button onClick={() => exportUnmappedLedgersToExcel(filteredUnmappedLedgers)} className="flex items-center bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white border border-gray-300 dark:border-transparent font-bold py-2 px-4 rounded-md transition-colors text-sm mr-2">
                                <DownloadIcon className="w-4 h-4 mr-2" />
                                Export Unmapped
                            </button>
                        </>
                    )}
                    <button onClick={() => setMastersModalOpen(true)} className="flex items-center bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white border border-gray-300 dark:border-transparent font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        <CogIcon className="w-4 h-4 mr-2" />
                        View Masters
                    </button>
                    <button onClick={() => exportMastersToExcel(masters)} className="flex items-center bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white border border-gray-300 dark:border-transparent font-bold py-2 px-4 rounded-md transition-colors text-sm" title="Export Masters to Excel">
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Export Masters
                    </button>
                    <button
                        onClick={() => {
                            setIsValidating(true);
                            const result = runAllValidations(trialBalanceData, masters);
                            setValidationResult(result);
                            setIsValidating(false);
                        }}
                        className={`flex items-center ${validationResult?.isValid === false ? 'bg-red-600 hover:bg-red-700' : validationResult?.isValid === true ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded-md transition-colors text-sm`}
                        disabled={isValidating}
                    >
                        <ShieldCheckIcon className="w-4 h-4 mr-2" />
                        {isValidating ? 'Validating...' : validationResult ? `Validate (${validationResult.criticalCount + validationResult.highCount} issues)` : 'Run Validation'}
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                <div className="lg:col-span-2 flex flex-col space-y-4 overflow-hidden">
                    {/* Shared Filter Bar - Above both lists */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex space-x-3 items-center shadow-sm dark:shadow-none">
                        <FunnelIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <select
                            value={filterMajorHead}
                            onChange={e => setFilterMajorHead(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm rounded p-1.5 text-gray-900 dark:text-white flex-1 focus:ring-brand-blue focus:border-brand-blue"
                        >
                            <option value="">All Major Heads</option>
                            {filterAvailableMajorHeads.map(mh => <option key={mh.code} value={mh.code}>{mh.name}</option>)}
                        </select>
                        <select
                            value={filterMinorHead}
                            onChange={e => setFilterMinorHead(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm rounded p-1.5 text-gray-900 dark:text-white flex-1 focus:ring-brand-blue focus:border-brand-blue"
                        >
                            <option value="">All Minor Heads</option>
                            {filterAvailableMinorHeads.map(mh => <option key={mh.code} value={mh.code}>{mh.name}</option>)}
                        </select>
                        <select
                            value={filterGrouping}
                            onChange={e => setFilterGrouping(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm rounded p-1.5 text-gray-900 dark:text-white flex-1 focus:ring-brand-blue focus:border-brand-blue"
                        >
                            <option value="">All Groupings</option>
                            {filterAvailableGroupings.map(g => <option key={g.code} value={g.code}>{g.name}</option>)}
                        </select>
                        {(filterMajorHead || filterMinorHead || filterGrouping) && (
                            <button
                                onClick={() => { setFilterMajorHead(''); setFilterMinorHead(''); setFilterGrouping(''); }}
                                className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-2"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <TrialBalanceTable
                        ledgers={filteredUnmappedLedgers}
                        activeLedgerId={selectedLedgerId}
                        onSelectLedger={handleSelectLedger}
                        selectedLedgerIds={selectedLedgerIds}
                        onToggleSelection={handleToggleSelection}
                        onSelectAll={handleSelectAll}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        masters={masters}
                        isProcessing={isBatchProcessing}
                        onBulkApprove={handleBulkApprove}
                        onBulkReject={handleBulkReject}
                    />

                    {/* Export Unmapped Button placed below TrialBalanceTable or near its header if possible. 
                        Since TrialBalanceTable is self-contained, adding it here or passing as prop.
                        For now, adding a small utility bar below the search if needed, but simpler to add to the main header 
                        OR add a specific action bar above this table if valuable. 
                        Actually, Main Header has "Import", so "Export Unmapped" logically fits there too.
                        Let's check the Header buttons again.
                    */}

                    <MappedLedgersTable
                        ledgers={filteredMappedLedgers}
                        masters={masters}
                        noteLineItems={scheduleData.noteLineItems}
                        activeLedgerId={selectedLedgerId}
                        onSelectLedger={handleSelectLedger}
                        selectedMappedIds={selectedMappedIds}
                        onToggleMappedSelection={role !== 'VIEWER' ? handleToggleMappedSelection : undefined}
                        onSelectAllMapped={role !== 'VIEWER' ? handleSelectAllMapped : undefined}
                        onUnmapLedger={role !== 'VIEWER' ? handleUnmapLedger : undefined}
                        onUpdateAttributes={role !== 'VIEWER' ? (ledgerId: string, attributes: LedgerAttributes) => {
                            setTrialBalanceData(prev => prev.map(item =>
                                item.id === ledgerId ? { ...item, attributes } : item
                            ));
                        } : undefined}
                    />
                </div>

                <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto p-4 shadow-sm dark:shadow-none">
                    {/* Bulk operations for MAPPED ledgers */}
                    {selectedMappedIds.size > 0 ? (
                        <div className="flex flex-col h-full">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Bulk Re-Map</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{selectedMappedIds.size} mapped items selected</p>

                            {role !== 'VIEWER' ? (
                                <div className="space-y-4">
                                    {/* AI Suggestion Button */}
                                    <button
                                        onClick={handleMappedAiSuggest}
                                        disabled={isBatchProcessing}
                                        className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-md transition-colors"
                                    >
                                        <WandIcon className="w-5 h-5 mr-2" />
                                        {isBatchProcessing ? 'Getting Suggestions...' : 'Get AI Suggestions'}
                                    </button>

                                    {/* AI Suggestions Review Panel */}
                                    {Object.keys(mappedSuggestions).length > 0 && (
                                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-purple-700 dark:text-purple-300 font-semibold text-sm">Review AI Suggestions</h3>
                                                <button
                                                    onClick={() => selectedMappedSuggestionIds.size === selectedMappedIds.size ? setSelectedMappedSuggestionIds(new Set()) : setSelectedMappedSuggestionIds(new Set(selectedMappedIds))}
                                                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 underline"
                                                >
                                                    {selectedMappedSuggestionIds.size === selectedMappedIds.size ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto mb-2">
                                                {Array.from(selectedMappedIds).map(id => {
                                                    const item = trialBalanceData.find(l => l.id === id);
                                                    if (!item) return null;
                                                    const sugg = mappedSuggestions[item.ledger];
                                                    if (!sugg || sugg.error) return (
                                                        <div key={id} className="text-xs text-red-500 dark:text-red-400 mb-1">{item.ledger}: {sugg?.error || 'No suggestion'}</div>
                                                    );
                                                    const majorName = masters.majorHeads.find(h => h.code === sugg.majorHeadCode)?.name || sugg.majorHeadCode;
                                                    const minorName = masters.minorHeads.find(h => h.code === sugg.minorHeadCode)?.name || sugg.minorHeadCode;
                                                    const groupingName = masters.groupings.find(h => h.code === sugg.groupingCode)?.name || sugg.groupingCode;
                                                    return (
                                                        <div key={id} className="flex items-start space-x-2 mb-2 text-xs">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedMappedSuggestionIds.has(id)}
                                                                onChange={() => {
                                                                    const newSet = new Set(selectedMappedSuggestionIds);
                                                                    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
                                                                    setSelectedMappedSuggestionIds(newSet);
                                                                }}
                                                                className="mt-0.5 h-3 w-3 rounded border-gray-600 bg-gray-700 text-purple-600"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-white truncate">{item.ledger}</div>
                                                                <div className="text-purple-200 opacity-70">{majorName} &gt; {minorName} &gt; {groupingName}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={handleApplyMappedSuggestions}
                                                disabled={selectedMappedSuggestionIds.size === 0}
                                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-1.5 rounded text-sm font-bold"
                                            >
                                                Apply {selectedMappedSuggestionIds.size} Suggestions
                                            </button>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-600 pt-4">
                                        <p className="text-xs text-gray-500 mb-2">Or manually select mapping:</p>
                                        <div className="space-y-2">
                                            <select value={batchMajorHead} onChange={e => { setBatchMajorHead(e.target.value); setBatchMinorHead(''); setBatchGrouping(''); }} className="block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm">
                                                <option value="">Select Major Head</option>
                                                {masters.majorHeads.map(mh => <option key={mh.code} value={mh.code}>{mh.name}</option>)}
                                            </select>
                                            <select value={batchMinorHead} onChange={e => { setBatchMinorHead(e.target.value); setBatchGrouping(''); }} disabled={!batchMajorHead} className="block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm disabled:bg-gray-800">
                                                <option value="">Select Minor Head</option>
                                                {batchAvailableMinorHeads.map(mh => <option key={mh.code} value={mh.code}>{mh.name}</option>)}
                                            </select>
                                            <select value={batchGrouping} onChange={e => setBatchGrouping(e.target.value)} disabled={!batchMinorHead} className="block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm disabled:bg-gray-800">
                                                <option value="">Select Grouping</option>
                                                {batchAvailableGroupings.map(g => <option key={g.code} value={g.code}>{g.name}</option>)}
                                            </select>
                                        </div>
                                        <button
                                            onClick={handleBulkRemapMapped}
                                            disabled={!batchMajorHead || !batchMinorHead || !batchGrouping}
                                            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors mt-2"
                                        >
                                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                                            Re-Map Manually
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedMappedIds(new Set()); setMappedSuggestions({}); }}
                                        className="w-full text-gray-400 hover:text-white py-1 text-sm"
                                    >
                                        Clear Selection
                                    </button>
                                </div>
                            ) : (
                                <p className="text-gray-400 italic">You do not have permission to re-map.</p>
                            )}
                        </div>
                    ) : selectedLedgerIds.size > 0 ? (
                        <div className="flex flex-col h-full">
                            <h2 className="text-xl font-bold text-white mb-2">Batch Operations</h2>
                            <p className="text-sm text-gray-400 mb-6">{selectedLedgerIds.size} items selected</p>

                            {role !== 'VIEWER' ? (
                                <>
                                    <button
                                        onClick={handleBatchAiSuggest}
                                        disabled={isBatchProcessing}
                                        className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-colors mb-4"
                                    >
                                        <WandIcon className="w-5 h-5 mr-2" />
                                        {isBatchProcessing ? 'Processing Batch...' : 'Get AI Suggestions'}
                                    </button>

                                    {activeSuggestionsCount > 0 && (
                                        <div className="mb-8 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-purple-300 font-semibold">Review Suggestions</h3>
                                                <button
                                                    onClick={() => selectedSuggestionIds.size === activeSuggestionsCount ? setSelectedSuggestionIds(new Set()) : setSelectedSuggestionIds(new Set(Array.from(selectedLedgerIds).filter(id => trialBalanceData.find(l => l.id === id)?.suggestedMajorHeadCode)))}
                                                    className="text-xs text-purple-400 hover:text-purple-300 underline"
                                                >
                                                    {selectedSuggestionIds.size === activeSuggestionsCount ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto mb-3 pr-2 custom-scrollbar">
                                                {Array.from(selectedLedgerIds).map(id => {
                                                    const item = trialBalanceData.find(l => l.id === id);
                                                    if (!item || !item.suggestedMajorHeadCode) return null;

                                                    const majorName = masters.majorHeads.find(h => h.code === item.suggestedMajorHeadCode)?.name || item.suggestedMajorHeadCode;
                                                    const minorName = masters.minorHeads.find(h => h.code === item.suggestedMinorHeadCode)?.name || item.suggestedMinorHeadCode;
                                                    const groupingName = masters.groupings.find(h => h.code === item.suggestedGroupingCode)?.name || item.suggestedGroupingCode;

                                                    return (
                                                        <div key={item.id} className="mb-3 border-b border-purple-500/20 pb-2 last:border-0 last:pb-0 flex items-start space-x-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSuggestionIds.has(item.id)}
                                                                onChange={() => handleToggleSuggestion(item.id)}
                                                                className="mt-1.5 h-4 w-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="font-bold text-white text-sm truncate" title={item.ledger}>{item.ledger}</div>
                                                                    <div className="text-xs font-mono text-green-400 ml-2 whitespace-nowrap">
                                                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(item.closingCy)}
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-purple-200 mt-1">
                                                                    <span className="opacity-70">{majorName}</span>
                                                                    <span className="mx-1 text-gray-500">&gt;</span>
                                                                    <span className="opacity-70">{minorName}</span>
                                                                    <span className="mx-1 text-gray-500">&gt;</span>
                                                                    <span className="font-medium text-purple-300">{groupingName}</span>
                                                                </div>
                                                                {item.suggestionConfidence && (
                                                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                                                        Confidence: {(item.suggestionConfidence * 100).toFixed(0)}%
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={handleBatchApprove}
                                                    disabled={selectedSuggestionIds.size === 0}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2 rounded text-sm font-bold shadow-md transition-colors"
                                                >
                                                    Approve {selectedSuggestionIds.size}
                                                </button>
                                                <button
                                                    onClick={handleClearSuggestions}
                                                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded text-sm shadow-md transition-colors"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-700 pt-6 space-y-4">
                                        <h3 className="font-semibold text-gray-200">Manual Batch Update</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Major Head</label>
                                            <select value={batchMajorHead} onChange={e => { setBatchMajorHead(e.target.value); setBatchMinorHead(''); setBatchGrouping(''); }} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                                <option value="">Select Major Head</option>
                                                {masters.majorHeads.map(mh => <option key={mh.code} value={mh.code}>{mh.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Minor Head</label>
                                            <select value={batchMinorHead} onChange={e => { setBatchMinorHead(e.target.value); setBatchGrouping(''); }} disabled={!batchMajorHead} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800">
                                                <option value="">Select Minor Head</option>
                                                {batchAvailableMinorHeads.map(mh => <option key={mh.code} value={mh.code}>{mh.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Grouping</label>
                                            <select value={batchGrouping} onChange={e => setBatchGrouping(e.target.value)} disabled={!batchMinorHead} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800">
                                                <option value="">Select Grouping</option>
                                                {batchAvailableGroupings.map(g => <option key={g.code} value={g.code}>{g.name}</option>)}
                                            </select>
                                        </div>
                                        <button
                                            onClick={handleBatchMap}
                                            disabled={!batchMajorHead || !batchMinorHead || !batchGrouping}
                                            className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-md transition-colors"
                                        >
                                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                                            Apply to Selected
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-400 italic">You do not have permission to perform batch mappings.</p>
                            )}
                        </div>
                    ) : (
                        <MappingPanel
                            ledger={selectedLedger}
                            masters={masters}
                            noteLineItems={scheduleData.noteLineItems}
                            onMapLedger={handleMapLedger}
                            onAddLineItem={onAddLineItem}
                            token={token}
                            readOnly={role === 'VIEWER'}
                        />
                    )}
                </div>
            </div>

            <ImportModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} onImport={handleImportWithAI} />
            <MastersModal isOpen={isMastersModalOpen} onClose={() => setMastersModalOpen(false)} masters={masters} setMasters={setMasters} token={token} />

            {/* Validation Panel */}
            {validationResult && (
                <div className="fixed bottom-4 right-4 w-[500px] max-h-[60vh] z-50">
                    <ValidationPanel
                        validationResult={validationResult}
                        onClose={() => setValidationResult(null)}
                    />
                </div>
            )}
        </div >
    );
};