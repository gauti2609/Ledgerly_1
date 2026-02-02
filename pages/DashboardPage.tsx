import React, { useState, useEffect, useMemo } from 'react';
import { FinancialEntity, Role, EntityType } from '../types.ts';
import * as apiService from '../services/apiService.ts';
import { PlusIcon, TrashIcon, UserIcon, CubeTransparentIcon, MagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { ConfirmationModal } from '../components/ConfirmationModal.tsx';

interface DashboardPageProps {
  token: string;
  role: Role | null;
  onSelectEntity: (entity: FinancialEntity) => void;
  onShowAuditLogs: () => void;
  onShowLicense: () => void;
  onShowConsolidation: () => void;
  onShowUserManagement: () => void;
  onShowApprovals: () => void;
  onLogout: () => void;
  userEmail?: string | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  token,
  role,
  userEmail,
  onSelectEntity,
  onShowAuditLogs,
  onShowLicense,
  onShowConsolidation,
  onShowUserManagement,
  onShowApprovals,
  onLogout
}) => {
  const [entities, setEntities] = useState<FinancialEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<EntityType>('Company');
  const [newFinancialYear, setNewFinancialYear] = useState('2024-2025');

  // Duplicate Check State
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingCreateData, setPendingCreateData] = useState<{ name: string, type: EntityType, fy: string } | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const [entityToDelete, setEntityToDelete] = useState<FinancialEntity | null>(null);

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const data = await apiService.getEntities(token);
        setEntities(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch entities.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntities();
  }, [token]);

  // Group Entities by Name (Case Insensitive)
  const groupedEntities = useMemo(() => {
    const groups: Record<string, FinancialEntity[]> = {};
    entities.forEach(ent => {
      const key = ent.name.toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(ent);
    });
    // Sort years descending within groups
    Object.values(groups).forEach(group => {
      group.sort((a, b) => b.financialYear.localeCompare(a.financialYear));
    });
    return Object.values(groups);
  }, [entities]);

  const filteredGroups = groupedEntities.filter(group => {
    const groupName = group[0].name.toLowerCase();
    return groupName.includes(searchQuery.toLowerCase());
  });

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;
    performCreate(newEntityName, newEntityType, newFinancialYear);
  };

  const performCreate = async (name: string, type: EntityType, fy: string, confirmNew?: boolean, linkToCode?: string) => {
    try {
      const result = await apiService.createEntity(token, name, type, fy, confirmNew, linkToCode);

      // Check for duplicates
      if (result.status === 'POSSIBLE_MATCHES') {
        setDuplicateMatches(result.matches);
        setPendingCreateData({ name, type, fy });
        setShowDuplicateModal(true);
        setCreateModalOpen(false); // Close main modal, show duplicate modal
        return;
      }

      // Success
      setEntities(prev => [...prev, result]);
      setCreateModalOpen(false);
      setNewEntityName('');
      setNewFinancialYear('2024-2025');
      setShowDuplicateModal(false);
      setPendingCreateData(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create entity.');
    }
  };

  const handleDuplicateResolve = (action: 'LINK' | 'NEW', match?: any) => {
    if (!pendingCreateData) return;
    if (action === 'LINK' && match) {
      performCreate(pendingCreateData.name, pendingCreateData.type, pendingCreateData.fy, undefined, match.companyCode);
    } else {
      performCreate(pendingCreateData.name, pendingCreateData.type, pendingCreateData.fy, true);
    }
  };

  const handleDeleteEntity = async () => {
    if (!entityToDelete) return;
    try {
      await apiService.deleteEntity(token, entityToDelete.id);
      setEntities(prev => prev.filter(e => e.id !== entityToDelete.id));
      setEntityToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete entity.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ledgerly Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Select an entity to work on or create a new one.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 pl-10 text-gray-900 dark:text-white focus:outline-none focus:border-brand-blue w-64 shadow-sm"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute left-3 top-2.5" />
          </div>

          {(role === 'ADMIN' || role === 'PLATFORM_ADMIN' || role === 'TENANT_ADMIN') && (
            <button
              onClick={onShowUserManagement}
              className="flex items-center px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <UserIcon className="w-5 h-5 mr-2" />
              Manage Users
            </button>
          )}

          {(role === 'PLATFORM_ADMIN' || role === 'TENANT_ADMIN' || role === 'MANAGER') && (
            <button
              onClick={onShowApprovals}
              id="manage-approvals-btn"
              className="flex items-center px-4 py-2 border border-indigo-500 text-indigo-500 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              Manage Approvals
            </button>
          )}
          <button
            onClick={onShowConsolidation}
            className="flex items-center px-4 py-2 border border-purple-500 text-purple-500 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <CubeTransparentIcon className="w-5 h-5 mr-2" />
            Consolidation
          </button>
          <div className="flex flex-col items-end space-y-2">
            {userEmail && (
              <span className="text-xs text-brand-blue-light font-mono bg-blue-50 dark:bg-gray-900/50 px-2 py-1 rounded border border-blue-200 dark:border-brand-blue/30 shadow-sm text-blue-700 dark:text-blue-300">
                {userEmail}
              </span>
            )}
            <div className="flex items-center space-x-4">
              {role === 'ADMIN' && (
                <button onClick={onShowAuditLogs} className="text-xs font-medium text-gray-500 hover:text-brand-blue-light transition-colors">Audit Logs</button>
              )}
              <button onClick={onShowLicense} className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">License</button>
              <button onClick={onLogout} className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </header>

      {isLoading && <p>Loading entities...</p>}
      {error && <p className="text-red-400">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredGroups.map(group => {
          const primary = group[0]; // Most recent year
          return (
            <div key={primary.companyCode || primary.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-blue dark:hover:border-brand-blue transition-colors relative flex flex-col justify-between shadow-sm dark:shadow-none" style={{ minHeight: '200px' }}>
              <div onClick={() => onSelectEntity(primary)} className="cursor-pointer flex-grow">
                <h2 className="font-bold text-lg text-gray-900 dark:text-white truncate mb-1">{primary.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{primary.entityType}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.from(new Set(group.map(e => e.financialYear)))
                    .sort((a, b) => (b as string).localeCompare(a as string))
                    .map(year => {
                      const ent = group.find(e => e.financialYear === year)!;
                      return (
                        <span
                          key={ent.id}
                          onClick={(e) => { e.stopPropagation(); onSelectEntity(ent); }}
                          className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${ent.id === primary.id ? 'bg-brand-blue text-white hover:bg-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        >
                          {year}
                        </span>
                      );
                    })}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
                <span>Updated: {new Date(primary.updatedAt).toLocaleDateString()}</span>
                <div className="flex space-x-1">
                  {/* Delete primary (or specific logic needed for deleting grouped?) - For now delete primary */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEntityToDelete(primary);
                    }}
                    className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button onClick={() => setCreateModalOpen(true)} className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-blue dark:hover:border-brand-blue hover:text-brand-blue text-gray-400 dark:text-gray-500 transition-colors" style={{ minHeight: '200px' }}>
          <PlusIcon className="w-8 h-8 mb-2" />
          <span className="font-semibold">Create New Entity</span>
        </button>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Financial Entity</h2>
            <form onSubmit={handleCreateEntity}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Entity Name</label>
                <input type="text" value={newEntityName} onChange={e => setNewEntityName(e.target.value)} required className="w-full mt-1 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Financial Year</label>
                <input type="text" value={newFinancialYear} onChange={e => setNewFinancialYear(e.target.value)} required placeholder="e.g. 2024-2025" className="w-full mt-1 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Entity Type</label>
                <select value={newEntityType} onChange={e => setNewEntityType(e.target.value as EntityType)} className="w-full mt-1 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none">
                  <option value="Company">Company</option>
                  <option value="LLP">LLP</option>
                  <option value="Non-Corporate">Non-Corporate Entity</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="py-2 px-4 bg-gray-100 dark:bg-gray-600 rounded-md text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">Cancel</button>
                <button type="submit" className="py-2 px-4 bg-brand-blue rounded-md text-white hover:bg-blue-600 transition-colors">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Resolution Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-200 dark:border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Similar Entity Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">We found existing entities with similar names. Do you want to add a new financial year to one of these?</p>

            <div className="mb-6 space-y-2 max-h-60 overflow-y-auto">
              {duplicateMatches.map((match: any) => (
                <div key={match.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center border border-gray-200 dark:border-gray-600">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{match.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Existing FY: {match.financialYear}</p>
                  </div>
                  <button onClick={() => handleDuplicateResolve('LINK', match)} className="text-sm bg-brand-blue px-3 py-1 rounded text-white hover:bg-blue-600 transition-colors">
                    Link to this
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
              <button onClick={() => setShowDuplicateModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
              <button onClick={() => handleDuplicateResolve('NEW')} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white px-4 py-2 rounded transition-colors">
                No, Create New Company
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!entityToDelete}
        onClose={() => setEntityToDelete(null)}
        onConfirm={handleDeleteEntity}
        title="Delete Entity?"
        message={`Are you sure you want to permanently delete "${entityToDelete?.name}"? All associated data will be lost.`}
        confirmButtonText="Yes, Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

    </div>
  );
};