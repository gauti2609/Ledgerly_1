
import React, { useState } from 'react';
// FIX: Add file extensions to fix module resolution errors.
import { Masters, MajorHead, MinorHead, Grouping } from '../types.ts';
import { CloseIcon, PlusIcon, ArrowPathIcon } from './icons.tsx';
import * as apiService from '../services/apiService.ts';

interface MastersModalProps {
    isOpen: boolean;
    onClose: () => void;
    masters: Masters;
    setMasters: (masters: Masters) => void;
    token: string; // Added for API calls
}

const MasterRow: React.FC<{ item: MajorHead | MinorHead | Grouping, level: number }> = ({ item, level }) => {
    if (!item) return null;
    return (
        <div>
            <div className={`flex items-center p-2 rounded-md ${level === 0 ? 'bg-gray-700/50' : ''}`}>
                <div style={{ paddingLeft: `${level * 1.5}rem` }} className="flex-1">
                    <span className="font-semibold text-gray-300">{item.code || 'N/A'}</span>
                    <span className="ml-4 text-gray-400">{item.name || 'Unnamed'}</span>
                </div>
            </div>
        </div>
    );
};


export const MastersModal: React.FC<MastersModalProps> = ({ isOpen, onClose, masters, setMasters, token }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [addingToMinorCode, setAddingToMinorCode] = useState<string | null>(null);
    const [newGroupingName, setNewGroupingName] = useState('');

    const filteredMasters = React.useMemo(() => {
        const allGroupings = masters?.groupings || [];
        const allMinorHeads = masters?.minorHeads || [];
        const allMajorHeads = masters?.majorHeads || [];

        if (!searchTerm) {
            return {
                majorHeads: allMajorHeads,
                minorHeads: allMinorHeads,
                groupings: allGroupings
            };
        }

        const lowerTerm = searchTerm.toLowerCase();

        // Filter groupings
        const matchingGroupings = allGroupings.filter(g =>
            (g.name || '').toLowerCase().includes(lowerTerm) || (g.code || '').toLowerCase().includes(lowerTerm)
        );

        // Find minor heads for these groupings OR matching minor heads themselves
        const matchingMinorHeads = allMinorHeads.filter(m =>
            (m.name || '').toLowerCase().includes(lowerTerm) ||
            (m.code || '').toLowerCase().includes(lowerTerm) ||
            matchingGroupings.some(g => g.minorHeadCode === m.code)
        );

        // Find major heads for these minor heads OR matching major heads themselves
        const matchingMajorHeads = allMajorHeads.filter(m =>
            (m.name || '').toLowerCase().includes(lowerTerm) ||
            (m.code || '').toLowerCase().includes(lowerTerm) ||
            matchingMinorHeads.some(mh => mh.majorHeadCode === m.code)
        );

        return {
            majorHeads: matchingMajorHeads,
            minorHeads: matchingMinorHeads,
            groupings: matchingGroupings
        };
    }, [masters, searchTerm]);

    if (!isOpen) return null;

    const generateGroupingCode = (minorHeadCode: string): string => {
        // Find existing groupings under this minor head
        const existingGroupings = masters.groupings.filter(g => g.minorHeadCode === minorHeadCode);
        // Generate code like MINOR_CODE_G001, MINOR_CODE_G002, etc.
        let counter = existingGroupings.length + 1;
        let newCode = `${minorHeadCode}_G${String(counter).padStart(3, '0')}`;

        // Ensure uniqueness
        while (masters.groupings.some(g => g.code === newCode)) {
            counter++;
            newCode = `${minorHeadCode}_G${String(counter).padStart(3, '0')}`;
        }
        return newCode;
    };

    const handleAddGrouping = async (minorHeadCode: string) => {
        if (!newGroupingName.trim()) return;

        const newCode = generateGroupingCode(minorHeadCode);
        const newGrouping: Grouping = {
            code: newCode,
            name: newGroupingName.trim(),
            minorHeadCode: minorHeadCode
        };

        // Update local state first
        setMasters({
            ...masters,
            groupings: [...masters.groupings, newGrouping]
        });

        // Sync to global masters so it's available for all entities
        try {
            await apiService.addGlobalGrouping(token, newGrouping);
            console.log('[MastersModal] Grouping synced to global masters:', newGrouping.code);
        } catch (error) {
            console.error('[MastersModal] Failed to sync grouping to global masters:', error);
            // Note: Local state is still updated; global sync failed but local entity has it
        }

        // Reset state
        setNewGroupingName('');
        setAddingToMinorCode(null);
    };

    const handleCancelAdd = () => {
        setNewGroupingName('');
        setAddingToMinorCode(null);
    };

    const handleSyncMasters = async () => {
        if (confirm('Are you sure you want to reset all masters to the default Standard groupings? This mimics a fresh start for masters.')) {
            try {
                await apiService.syncMasters(token);
                alert('Masters synced successfully! The page will now reload.');
                window.location.reload();
            } catch (error) {
                console.error('Failed to sync masters:', error);
                alert('Failed to sync masters. See console for details.');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-2xl flex flex-col" style={{ height: '90vh' }}>
                <header className="p-4 border-b border-gray-700 flex flex-col space-y-3">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-100">Chart of Accounts Masters</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search masters..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                </header>
                <main className="p-6 flex-1 overflow-y-auto">
                    <div className="space-y-2">
                        {filteredMasters.majorHeads.map(major => (
                            <div key={major.code} className="bg-gray-900/50 rounded-lg p-2">
                                <MasterRow item={major} level={0} />
                                <div className="pl-6 pt-2 space-y-1">
                                    {filteredMasters.minorHeads.filter(minor => minor.majorHeadCode === major.code).map(minor => (
                                        <div key={minor.code}>
                                            {/* Minor Head Row with Add Button */}
                                            <div className="flex items-center justify-between">
                                                <MasterRow item={minor} level={1} />
                                                <button
                                                    onClick={() => setAddingToMinorCode(minor.code)}
                                                    className="p-1 rounded text-green-400 hover:bg-green-900/30 transition-all mr-2"
                                                    title="Add Grouping"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Groupings List */}
                                            <div className="pl-6 pt-2 space-y-1">
                                                {filteredMasters.groupings.filter(group => group.minorHeadCode === minor.code).map(group => (
                                                    <MasterRow key={group.code} item={group} level={2} />
                                                ))}

                                                {/* Add Grouping Form (inline) */}
                                                {addingToMinorCode === minor.code && (
                                                    <div className="flex items-center gap-2 p-2 bg-gray-700/30 rounded-md ml-6">

                                                        <input
                                                            type="text"
                                                            value={newGroupingName}
                                                            onChange={(e) => setNewGroupingName(e.target.value)}
                                                            placeholder="New grouping name..."
                                                            className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleAddGrouping(minor.code);
                                                                if (e.key === 'Escape') handleCancelAdd();
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleAddGrouping(minor.code)}
                                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded transition-colors"
                                                        >
                                                            Add
                                                        </button>
                                                        <button
                                                            onClick={handleCancelAdd}
                                                            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
                <footer className="p-4 bg-gray-800/50 border-t border-gray-700 flex justify-between items-center">
                    <button
                        onClick={handleSyncMasters}
                        className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-sm font-medium"
                        title="Reset masters to default structure"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                        Reset Masters (Sync to Standard Groupings)
                    </button>
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};