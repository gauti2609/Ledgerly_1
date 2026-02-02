import React, { useState } from 'react';
// FIX: Add file extensions to fix module resolution errors.
import { AllData } from '../types.ts';
import { ErrorBoundary } from '../components/ErrorBoundary.tsx';
// FIX: Add file extension to fix module resolution error.
import { BalanceSheet } from '../components/reports/BalanceSheet.tsx';
import { ProfitAndLossStatement } from '../components/reports/ProfitAndLossStatement.tsx';
import { CashFlowStatement } from '../components/reports/CashFlowStatement.tsx';
// FIX: Add file extension to fix module resolution error.
import { NotesToAccounts } from '../components/reports/NotesToAccounts.tsx';
import { RatioAnalysis } from '../components/reports/RatioAnalysis.tsx';
import { StatementOfChangesInEquity } from '../components/reports/StatementOfChangesInEquity.tsx';
// FIX: Add file extension to fix module resolution error.
import { exportToExcel } from '../services/exportService.ts';
import { DownloadIcon, PrintIcon } from '../components/icons.tsx';

interface ReportsPageProps {
    allData: AllData;
}

type ReportView = 'bs' | 'pl' | 'cf' | 'notes' | 'ratios' | 'soce';

export const ReportsPage: React.FC<ReportsPageProps> = ({ allData }) => {
    const [activeView, setActiveView] = useState<ReportView>('bs');
    const { scheduleData } = allData;
    // FIX: Replaced deprecated 'corporateInfo' with 'entityInfo' to align with the updated 'ScheduleData' type definition.
    const { roundingUnit, currencySymbol } = scheduleData.entityInfo;
    const unitText = roundingUnit.charAt(0).toUpperCase() + roundingUnit.slice(1);

    const renderReport = () => {
        switch (activeView) {
            case 'bs': return <BalanceSheet allData={allData} />;
            case 'pl': return <ProfitAndLossStatement allData={allData} />;
            case 'cf': return <CashFlowStatement allData={allData} />;
            case 'notes': return <NotesToAccounts allData={allData} />;
            case 'ratios': return <RatioAnalysis allData={allData} />;
            case 'soce': return <StatementOfChangesInEquity allData={allData} />;
            default: return null;
        }
    };

    const reportNav = [
        { id: 'bs', name: 'Balance Sheet' },
        { id: 'pl', name: 'Profit & Loss' },
        { id: 'cf', name: 'Cash Flow' },
        { id: 'notes', name: 'Notes to Accounts' },
        { id: 'ratios', name: 'Ratio Analysis' },
        { id: 'soce', name: 'SOCE' },
    ];

    return (
        <div className="p-6 h-full flex flex-col space-y-4 print:p-0">
            <header className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
                    <p className="text-sm text-gray-400">View and export generated financial statements.</p>
                </div>
                <div className="flex items-center space-x-2">
                    {activeView === 'notes' && (
                        <button onClick={() => window.print()} className="flex items-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                            <PrintIcon className="w-4 h-4 mr-2" />
                            Print Notes
                        </button>
                    )}
                    <button onClick={() => exportToExcel(allData)} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Export to Excel
                    </button>
                </div>
            </header>
            <div className="flex justify-between items-center border-b border-gray-700 print:hidden">
                <div className="flex">
                    {reportNav.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as ReportView)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeView === item.id
                                ? 'border-brand-blue text-brand-blue-light'
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
                <div className="text-sm text-gray-400">
                    (All amounts in ₹ {unitText})
                </div>
            </div>
            <main className="flex-1 overflow-y-auto bg-gray-800 p-6 rounded-lg border border-gray-700 print:bg-transparent print:p-0 print:border-none print:shadow-none">
                <ErrorBoundary key={activeView}>
                    {renderReport()}
                </ErrorBoundary>
            </main>
        </div>
    );
};