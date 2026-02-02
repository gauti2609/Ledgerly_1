import React, { useState, useEffect, useCallback } from 'react';
import {
    ConsolidationGroup,
    ConsolidatedData,
    FinancialEntity,
    AllData,
    InterCompanyElimination,
    SubsidiaryConfig,
} from '../types.ts';
import * as apiService from '../services/apiService.ts';
import * as consolidationService from '../services/consolidationService.ts';
import { GroupSetupModal } from '../components/consolidation/GroupSetupModal.tsx';
import { EliminationEditor } from '../components/consolidation/EliminationEditor.tsx';
import { ConsolidatedReports } from '../components/consolidation/ConsolidatedReports.tsx';
import { PlusIcon, TrashIcon, CogIcon, ChartBarIcon } from '../components/icons.tsx';

interface ConsolidationPageProps {
    token: string;
    entities: FinancialEntity[];
    onBack: () => void;
    userEmail?: string | null;
}

type Tab = 'setup' | 'eliminations' | 'reports';

export const ConsolidationPage: React.FC<ConsolidationPageProps> = ({
    token,
    entities,
    onBack,
    userEmail,
}) => {
    const [groups, setGroups] = useState<ConsolidationGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<ConsolidationGroup | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('setup');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Consolidated data
    const [consolidatedData, setConsolidatedData] = useState<ConsolidatedData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Entity data cache
    const [entityDataCache, setEntityDataCache] = useState<Map<string, AllData>>(new Map());

    // Fetch consolidation groups on mount
    useEffect(() => {
        const fetchGroups = async () => {
            setIsLoading(true);
            try {
                // For now, use localStorage as mock backend
                const storedGroups = localStorage.getItem('consolidationGroups');
                const loadedGroups: ConsolidationGroup[] = storedGroups ? JSON.parse(storedGroups) : [];
                setGroups(loadedGroups);
            } catch (err: any) {
                setError(err.message || 'Failed to load consolidation groups');
            } finally {
                setIsLoading(false);
            }
        };
        fetchGroups();
    }, [token]);

    // Save groups to localStorage whenever they change
    const saveGroups = useCallback((updatedGroups: ConsolidationGroup[]) => {
        localStorage.setItem('consolidationGroups', JSON.stringify(updatedGroups));
        setGroups(updatedGroups);
    }, []);

    // Handle creating a new group
    const handleCreateGroup = (parentEntity: FinancialEntity) => {
        const newGroup = consolidationService.createEmptyConsolidationGroup(parentEntity);
        const updatedGroups = [...groups, newGroup];
        saveGroups(updatedGroups);
        setSelectedGroup(newGroup);
        setShowCreateModal(false);
    };

    // Handle updating a group
    const handleUpdateGroup = (updatedGroup: ConsolidationGroup) => {
        updatedGroup.updatedAt = new Date().toISOString();
        const updatedGroups = groups.map(g => g.id === updatedGroup.id ? updatedGroup : g);
        saveGroups(updatedGroups);
        setSelectedGroup(updatedGroup);
    };

    // Handle deleting a group
    const handleDeleteGroup = (groupId: string) => {
        const updatedGroups = groups.filter(g => g.id !== groupId);
        saveGroups(updatedGroups);
        if (selectedGroup?.id === groupId) {
            setSelectedGroup(null);
        }
    };

    // Add subsidiary to group
    const handleAddSubsidiary = (entity: FinancialEntity, ownershipPct: number) => {
        if (!selectedGroup) return;
        const newSub = consolidationService.createSubsidiaryConfig(entity, ownershipPct);
        const updated = {
            ...selectedGroup,
            subsidiaries: [...selectedGroup.subsidiaries, newSub],
        };
        handleUpdateGroup(updated);
    };

    // Remove subsidiary from group
    const handleRemoveSubsidiary = (entityId: string) => {
        if (!selectedGroup) return;
        const updated = {
            ...selectedGroup,
            subsidiaries: selectedGroup.subsidiaries.filter(s => s.entityId !== entityId),
        };
        handleUpdateGroup(updated);
    };

    // Add elimination entry
    const handleAddElimination = (elimination: InterCompanyElimination) => {
        if (!selectedGroup) return;
        const updated = {
            ...selectedGroup,
            eliminations: [...selectedGroup.eliminations, elimination],
        };
        handleUpdateGroup(updated);
    };

    // Remove elimination entry
    const handleRemoveElimination = (eliminationId: string) => {
        if (!selectedGroup) return;
        const updated = {
            ...selectedGroup,
            eliminations: selectedGroup.eliminations.filter(e => e.id !== eliminationId),
        };
        handleUpdateGroup(updated);
    };

    // Fetch entity data for consolidated report generation
    const fetchEntityData = async (entityId: string): Promise<AllData | null> => {
        if (entityDataCache.has(entityId)) {
            return entityDataCache.get(entityId)!;
        }
        try {
            const data = await apiService.getEntityData(token, entityId);
            setEntityDataCache(prev => new Map(prev).set(entityId, data));
            return data;
        } catch (err) {
            console.error(`Failed to fetch data for entity ${entityId}:`, err);
            return null;
        }
    };

    // Generate consolidated data
    const handleGenerateReport = async () => {
        if (!selectedGroup) return;

        setIsGenerating(true);
        setError(null);

        try {
            const parentEntity = entities.find(e => e.id === selectedGroup.parentEntityId);
            if (!parentEntity) throw new Error('Parent entity not found');

            const parentData = await fetchEntityData(selectedGroup.parentEntityId);
            if (!parentData) throw new Error('Failed to load parent entity data');

            const subsidiaryEntities: FinancialEntity[] = [];
            const subsidiaryDataMap = new Map<string, AllData>();

            for (const sub of selectedGroup.subsidiaries) {
                const entity = entities.find(e => e.id === sub.entityId);
                if (entity) {
                    subsidiaryEntities.push(entity);
                    const data = await fetchEntityData(sub.entityId);
                    if (data) {
                        subsidiaryDataMap.set(sub.entityId, data);
                    }
                }
            }

            const consolidated = consolidationService.generateConsolidatedData(
                selectedGroup,
                parentEntity,
                parentData,
                subsidiaryEntities,
                subsidiaryDataMap
            );

            setConsolidatedData(consolidated);
            setActiveTab('reports');
        } catch (err: any) {
            setError(err.message || 'Failed to generate consolidated report');
        } finally {
            setIsGenerating(false);
        }
    };

    // Get available entities for subsidiary selection (exclude parent and already added subsidiaries)
    const getAvailableSubsidiaries = (): FinancialEntity[] => {
        if (!selectedGroup) return entities;
        const usedIds = new Set([
            selectedGroup.parentEntityId,
            ...selectedGroup.subsidiaries.map(s => s.entityId),
        ]);
        return entities.filter(e => !usedIds.has(e.id));
    };

    // Tab component
    const TabButton: React.FC<{ tab: Tab; label: string; icon: React.ReactNode }> = ({
        tab,
        label,
        icon,
    }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab
                ? 'bg-brand-blue text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
        >
            {icon}
            <span className="ml-2">{label}</span>
        </button>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Loading consolidation groups...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <div>
                    <button
                        onClick={onBack}
                        className="text-brand-blue-light hover:text-white text-sm mb-2"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-white">Multi-Entity Consolidation</h1>
                    <p className="text-gray-400">
                        Consolidate financial statements across multiple entities
                    </p>
                </div>
                <div className="flex flex-col items-end space-y-3">
                    {userEmail && (
                        <span className="text-xs text-brand-blue-light font-mono bg-gray-900/50 px-2 py-1 rounded border border-brand-blue/30 shadow-sm">
                            {userEmail}
                        </span>
                    )}
                    <div className="flex items-center space-x-4 text-sm">
                        <button onClick={onBack} className="text-xs font-medium text-gray-400 hover:text-white transition-colors mr-2">
                            &larr; Back to Dashboard
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-dark transition-colors"
                        >
                            <PlusIcon className="w-5 h-5 mr-1" />
                            New Group
                        </button>
                    </div>
                </div>
            </header>

            {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            <div className="flex gap-6">
                {/* Groups List */}
                <aside className="w-72 flex-shrink-0">
                    <h2 className="text-lg font-semibold mb-4">Consolidation Groups</h2>
                    <div className="space-y-2">
                        {groups.length === 0 ? (
                            <p className="text-gray-500 text-sm">No groups created yet.</p>
                        ) : (
                            groups.map(group => (
                                <div
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group)}
                                    className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedGroup?.id === group.id
                                        ? 'bg-brand-blue/20 border border-brand-blue'
                                        : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium text-white">{group.name}</h3>
                                            <p className="text-sm text-gray-400">
                                                Parent: {group.parentEntityName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {group.subsidiaries.length} subsidiaries
                                            </p>
                                        </div>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleDeleteGroup(group.id);
                                            }}
                                            className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-gray-800 rounded-lg p-6">
                    {!selectedGroup ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <ChartBarIcon className="w-16 h-16 mb-4 opacity-50" />
                            <p>Select or create a consolidation group to get started</p>
                        </div>
                    ) : (
                        <>
                            {/* Group Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedGroup.name}</h2>
                                    <p className="text-sm text-gray-400">
                                        Last updated: {new Date(selectedGroup.updatedAt).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={isGenerating || selectedGroup.subsidiaries.length === 0}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isGenerating ? (
                                        <>
                                            <span className="animate-spin mr-2">⏳</span>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <ChartBarIcon className="w-5 h-5 mr-2" />
                                            Generate Report
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex space-x-2 mb-6 border-b border-gray-700 pb-4">
                                <TabButton
                                    tab="setup"
                                    label="Group Setup"
                                    icon={<CogIcon className="w-4 h-4" />}
                                />
                                <TabButton
                                    tab="eliminations"
                                    label={`Eliminations (${selectedGroup.eliminations.length})`}
                                    icon={<TrashIcon className="w-4 h-4" />}
                                />
                                <TabButton
                                    tab="reports"
                                    label="Consolidated Reports"
                                    icon={<ChartBarIcon className="w-4 h-4" />}
                                />
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'setup' && (
                                <GroupSetupModal
                                    group={selectedGroup}
                                    entities={entities}
                                    availableSubsidiaries={getAvailableSubsidiaries()}
                                    onAddSubsidiary={handleAddSubsidiary}
                                    onRemoveSubsidiary={handleRemoveSubsidiary}
                                    onUpdateGroup={handleUpdateGroup}
                                    inline
                                />
                            )}

                            {activeTab === 'eliminations' && (
                                <EliminationEditor
                                    eliminations={selectedGroup.eliminations}
                                    onAddElimination={handleAddElimination}
                                    onRemoveElimination={handleRemoveElimination}
                                />
                            )}

                            {activeTab === 'reports' && (
                                <ConsolidatedReports
                                    consolidatedData={consolidatedData}
                                    group={selectedGroup}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
                        <h2 className="text-xl font-bold mb-4">Create Consolidation Group</h2>
                        <p className="text-gray-400 mb-4">Select the parent entity for this group:</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {entities.map(entity => (
                                <button
                                    key={entity.id}
                                    onClick={() => handleCreateGroup(entity)}
                                    className="w-full p-3 text-left rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                                >
                                    <div className="font-medium">{entity.name}</div>
                                    <div className="text-sm text-gray-400">{entity.entityType}</div>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
