import React, { useState } from 'react';
import {
    ConsolidationGroup,
    FinancialEntity,
    SubsidiaryConfig,
    ConsolidationMethod,
} from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface GroupSetupModalProps {
    group: ConsolidationGroup;
    entities: FinancialEntity[];
    availableSubsidiaries: FinancialEntity[];
    onAddSubsidiary: (entity: FinancialEntity, ownershipPct: number) => void;
    onRemoveSubsidiary: (entityId: string) => void;
    onUpdateGroup: (group: ConsolidationGroup) => void;
    inline?: boolean; // If true, render inline instead of as modal
}

export const GroupSetupModal: React.FC<GroupSetupModalProps> = ({
    group,
    entities,
    availableSubsidiaries,
    onAddSubsidiary,
    onRemoveSubsidiary,
    onUpdateGroup,
    inline = false,
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedEntityId, setSelectedEntityId] = useState('');
    const [ownershipPct, setOwnershipPct] = useState(100);

    const handleAddSubsidiary = () => {
        if (!selectedEntityId) return;
        const entity = availableSubsidiaries.find(e => e.id === selectedEntityId);
        if (entity) {
            onAddSubsidiary(entity, ownershipPct);
            setSelectedEntityId('');
            setOwnershipPct(100);
            setShowAddForm(false);
        }
    };

    const handleUpdateSubsidiary = (
        entityId: string,
        field: keyof SubsidiaryConfig,
        value: any
    ) => {
        const updated = {
            ...group,
            subsidiaries: group.subsidiaries.map(sub =>
                sub.entityId === entityId
                    ? {
                        ...sub,
                        [field]: value,
                        isFullyOwned: field === 'ownershipPercentage' ? value === 100 : sub.isFullyOwned,
                    }
                    : sub
            ),
        };
        onUpdateGroup(updated);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateGroup({ ...group, name: e.target.value });
    };

    const parentEntity = entities.find(e => e.id === group.parentEntityId);

    const content = (
        <div className="space-y-6">
            {/* Group Name */}
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Consolidation Group Name
                </label>
                <input
                    type="text"
                    value={group.name}
                    onChange={handleNameChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-brand-blue focus:outline-none"
                    placeholder="e.g., ABC Group Consolidated"
                />
            </div>

            {/* Parent Entity */}
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Parent Entity (Holding Company)
                </label>
                <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-white">{parentEntity?.name}</div>
                            <div className="text-sm text-gray-400">{parentEntity?.entityType}</div>
                        </div>
                        <span className="px-3 py-1 bg-brand-blue/20 text-brand-blue-light rounded-full text-sm">
                            Parent (100%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Subsidiaries */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-gray-400">Subsidiaries</label>
                    {availableSubsidiaries.length > 0 && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center text-sm text-brand-blue-light hover:text-white"
                        >
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Add Subsidiary
                        </button>
                    )}
                </div>

                {group.subsidiaries.length === 0 ? (
                    <div className="p-6 bg-gray-700/50 rounded-lg border border-dashed border-gray-600 text-center text-gray-500">
                        No subsidiaries added yet. Add subsidiaries to create a consolidation group.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {group.subsidiaries.map(sub => (
                            <div
                                key={sub.entityId}
                                className="p-4 bg-gray-700 rounded-lg border border-gray-600"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-medium text-white">{sub.entityName}</div>
                                        <div className="mt-3 grid grid-cols-2 gap-4">
                                            {/* Ownership % */}
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Ownership %
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={sub.ownershipPercentage}
                                                    onChange={e =>
                                                        handleUpdateSubsidiary(
                                                            sub.entityId,
                                                            'ownershipPercentage',
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                    className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                                />
                                            </div>
                                            {/* Consolidation Method */}
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Method
                                                </label>
                                                <select
                                                    value={sub.consolidationMethod}
                                                    onChange={e =>
                                                        handleUpdateSubsidiary(
                                                            sub.entityId,
                                                            'consolidationMethod',
                                                            e.target.value as ConsolidationMethod
                                                        )
                                                    }
                                                    className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                                >
                                                    <option value="full">Full Consolidation</option>
                                                    <option value="proportionate">Proportionate</option>
                                                    <option value="equity">Equity Method</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onRemoveSubsidiary(sub.entityId)}
                                        className="p-2 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                {!sub.isFullyOwned && (
                                    <div className="mt-2 text-xs text-yellow-400">
                                        ⚠️ Minority Interest: {100 - sub.ownershipPercentage}%
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Subsidiary Form */}
                {showAddForm && (
                    <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                        <h4 className="font-medium mb-3">Add Subsidiary</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">Entity</label>
                                <select
                                    value={selectedEntityId}
                                    onChange={e => setSelectedEntityId(e.target.value)}
                                    className="w-full p-2 bg-gray-600 border border-gray-500 rounded"
                                >
                                    <option value="">Select entity...</option>
                                    {availableSubsidiaries.map(entity => (
                                        <option key={entity.id} value={entity.id}>
                                            {entity.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Ownership %</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={ownershipPct}
                                    onChange={e => setOwnershipPct(Number(e.target.value))}
                                    className="w-full p-2 bg-gray-600 border border-gray-500 rounded"
                                />
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end space-x-2">
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-3 py-1.5 bg-gray-600 rounded text-sm hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSubsidiary}
                                disabled={!selectedEntityId}
                                className="px-3 py-1.5 bg-brand-blue rounded text-sm hover:bg-brand-blue-dark disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-700/50 rounded-lg">
                <h4 className="font-medium mb-2 text-white">Consolidation Summary</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Parent: {group.parentEntityName}</li>
                    <li>• Subsidiaries: {group.subsidiaries.length}</li>
                    <li>
                        • Full ownership:{' '}
                        {group.subsidiaries.filter(s => s.isFullyOwned).length} entities
                    </li>
                    <li>
                        • Partial ownership:{' '}
                        {group.subsidiaries.filter(s => !s.isFullyOwned).length} entities
                    </li>
                    <li>• Eliminations: {group.eliminations.length} entries</li>
                </ul>
            </div>
        </div>
    );

    if (inline) {
        return content;
    }

    // Modal wrapper - not currently used since we render inline
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
                {content}
            </div>
        </div>
    );
};
