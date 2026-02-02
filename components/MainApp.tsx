import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './Sidebar.tsx';
import { MappingWorkbench } from './MappingWorkbench.tsx';
import { SchedulesPage } from '../pages/SchedulesPage.tsx';
import { NotesSelectionPage } from '../pages/NotesSelectionPage.tsx';
import { ReportsPage } from '../pages/ReportsPage.tsx';
import { Page, TrialBalanceItem, Masters, ScheduleData, AllData, FinancialEntity, Role } from '../types.ts';
import * as apiService from '../services/apiService.ts';
import { mockMasters, initialScheduleData } from '../data/mockData.ts';
import { useHistoryState } from '../hooks/useHistoryState.ts';
import { useDebouncedSave } from '../hooks/useDebouncedSave.ts';
import { SaveStatusIndicator } from './SaveStatusIndicator.tsx';
import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from './icons.tsx';
import { Chatbot } from './Chatbot.tsx';
import { CaroReport } from './reports/CaroReport.tsx';
import { Form3CD } from './reports/Form3CD.tsx';
import { CashFlowGenerator } from './reports/CashFlowGenerator.tsx';
import { TaxBridgeReport } from './reports/TaxBridgeReport.tsx';
import { ApprovalWorkflow } from './ApprovalWorkflow.tsx';
import { getUserIdFromToken } from '../utils/jwt.ts';
import { NumberFormatProvider } from '../context/NumberFormatContext.tsx';

interface MainAppProps {
  entity: FinancialEntity;
  entities: FinancialEntity[];
  onBack: () => void;
  onSelectEntity: (entity: FinancialEntity) => void;
  onLogout: () => void;
  token: string;
  role: Role | null;
  userEmail?: string | null;
}

export const MainApp: React.FC<MainAppProps> = ({ entity, entities, onBack, onSelectEntity, onLogout, token, role, userEmail }) => {
  const [activePage, setActivePage] = useState<Page>(() => {
    return (window.localStorage.getItem(`activePage_${entity.id}`) as Page) || 'mapping';
  });

  useEffect(() => {
    window.localStorage.setItem(`activePage_${entity.id}`, activePage);
  }, [activePage, entity.id]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { state: allData, setState: setAllData, undo, redo, canUndo, canRedo } = useHistoryState<AllData | null>(null);

  const handleSave = useCallback(async (dataToSave: AllData) => {
    await apiService.updateEntity(token, entity.id, dataToSave);
  }, [token, entity.id]);

  const { saveStatus } = useDebouncedSave(allData, handleSave);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiService.getEntityData(token, entity.id);
        // Initialize with default structure if data is missing from backend
        const initialState = {
          trialBalanceData: data.trialBalanceData || [],
          masters: data.masters || mockMasters,
          scheduleData: { ...initialScheduleData, ...data.scheduleData, entityInfo: { ...initialScheduleData.entityInfo, entityType: entity.entityType, companyName: entity.name } },
        };
        setAllData(initialState, true); // Set initial state without adding to history
      } catch (err: any) {
        setError(err.message || "Failed to load entity data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [entity.id, token, setAllData]);


  const handleImport = (data: Omit<TrialBalanceItem, 'id' | 'isMapped' | 'majorHeadCode' | 'minorHeadCode' | 'groupingCode'>[]) => {
    if (!allData) return;
    const newData: TrialBalanceItem[] = data.map(item => ({
      ...item,
      id: uuidv4(),
      isMapped: false,
      majorHeadCode: null,
      minorHeadCode: null,
      groupingCode: null,
      noteLineItemId: null,
    }));
    setAllData({ ...allData, trialBalanceData: newData });
    setActivePage('mapping');
  };

  const setTrialBalanceData = (setter: React.SetStateAction<TrialBalanceItem[]>) => {
    setAllData(prev => {
      if (!prev) return prev;
      const newTB = typeof setter === 'function' ? setter(prev.trialBalanceData) : setter;
      return { ...prev, trialBalanceData: newTB };
    });
  };

  const setScheduleData = (setter: React.SetStateAction<ScheduleData>) => {
    setAllData(prev => {
      if (!prev) return prev;
      const newScheduleData = typeof setter === 'function' ? setter(prev.scheduleData) : setter;
      return { ...prev, scheduleData: newScheduleData };
    });
  };

  const setMasters = (newMasters: Masters) => {
    setAllData(prev => prev ? ({ ...prev, masters: newMasters }) : null);
  }

  const handleAddLineItem = (noteId: string, name: string) => {
    setAllData(prev => {
      if (!prev) return prev;
      const newItem = {
        id: uuidv4(),
        noteId,
        name
      };
      return {
        ...prev,
        scheduleData: {
          ...prev.scheduleData,
          noteLineItems: [...prev.scheduleData.noteLineItems, newItem]
        }
      };
    });
  };

  const renderPage = () => {
    if (isLoading) return <div className="p-6 text-center">Loading data for {entity.name}...</div>;
    if (error) return <div className="p-6 text-center text-red-400">{error}</div>;
    if (!allData) return <div className="p-6 text-center">No data available.</div>;

    switch (activePage) {
      case 'mapping':
        return <MappingWorkbench allData={allData} setTrialBalanceData={setTrialBalanceData} onImport={handleImport} masters={allData.masters} setMasters={setMasters} onAddLineItem={handleAddLineItem} token={token} role={role} />;
      case 'schedules':
        return <SchedulesPage allData={allData} setScheduleData={setScheduleData} setAllData={setAllData} role={role} />;
      case 'notes':
        return <NotesSelectionPage allData={allData} setScheduleData={setScheduleData} />;
      case 'reports':
        return <ReportsPage allData={allData} />;
      case 'caro':
        return <CaroReport token={token} entityId={entity.id} trialBalanceData={allData.trialBalanceData} masters={allData.masters} />;
      case 'tax-audit':
        return <Form3CD token={token} entityId={entity.id} trialBalanceData={allData.trialBalanceData} masters={allData.masters} />;
      case 'cash-flow':
        return <CashFlowGenerator trialBalanceData={allData.trialBalanceData} masters={allData.masters} />;
      case 'tax-bridge':
        return <TaxBridgeReport trialBalanceData={allData.trialBalanceData} masters={allData.masters} />;
      case 'approval-center':
        const currentUserId = getUserIdFromToken(token) || '';
        return <ApprovalWorkflow
          entityId={entity.id}
          token={token}
          role={role}
          currentUserId={currentUserId}
        />;
      default:
        return <div>Page not found</div>;
    }
  };

  // Inside MainApp component, before return:
  const decimalPlaces = allData?.scheduleData?.entityInfo?.decimalPlaces ?? 2;
  const numberFormat = allData?.scheduleData?.entityInfo?.numberFormat ?? 'Indian';

  // Header Switcher Logic
  const siblings = entities.filter(e =>
    (e.companyCode === entity.companyCode || e.name.toLowerCase().trim() === entity.name.toLowerCase().trim()) &&
    e.id !== entity.id
  );

  // Deduplicate siblings by year
  const uniqueSiblingYears = Array.from(new Set(siblings.map(s => s.financialYear)));
  const otherYears = uniqueSiblingYears.map(year => siblings.find(s => s.financialYear === year)!)
    .sort((a, b) => b.financialYear.localeCompare(a.financialYear));

  return (
    <NumberFormatProvider decimalPlaces={decimalPlaces} formatStyle={numberFormat}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
        <Sidebar activePage={activePage} setActivePage={setActivePage} onBack={onBack} onLogout={onLogout} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{entity.name}</h2>
              {otherYears.length > 0 && (
                <select
                  value={entity.id}
                  onChange={(e) => {
                    const selected = entities.find(ent => ent.id === e.target.value);
                    if (selected) onSelectEntity(selected);
                  }}
                  className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-brand-blue"
                >
                  <option value={entity.id}>{entity.financialYear}</option>
                  {otherYears.map(oy => (
                    <option key={oy.id} value={oy.id}>{oy.financialYear}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex flex-col items-end space-y-2">
              {userEmail && (
                <span className="text-xs text-brand-blue-light font-mono bg-blue-50 dark:bg-gray-900/50 px-2 py-1 rounded border border-blue-200 dark:border-brand-blue/30 shadow-sm text-blue-700 dark:text-blue-300">
                  {userEmail}
                </span>
              )}
              <div className="flex items-center space-x-4">
                <SaveStatusIndicator status={saveStatus} />
                <div className="flex items-center space-x-1">
                  <button onClick={undo} disabled={!canUndo} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300">
                    <ArrowUturnLeftIcon className="w-5 h-5" />
                  </button>
                  <button onClick={redo} disabled={!canRedo} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300">
                    <ArrowUturnRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">
            {renderPage()}
          </div>
        </main>
        <Chatbot token={token} />
      </div>
    </NumberFormatProvider>
  );
};