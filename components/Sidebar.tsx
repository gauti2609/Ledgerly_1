import React from 'react';
import { Page } from '../types.ts';
import { MapIcon, FileTextIcon, ListBulletIcon, BarChartIcon, ArrowLeftIcon, LogoutIcon, ShieldCheckIcon } from './icons.tsx';

interface SidebarProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
    onBack: () => void;
    onLogout: () => void;
}

const NavItem: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
}> = ({ label, isActive, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
            ? 'bg-brand-blue text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
    >
        {icon}
        <span className="ml-3">{label}</span>
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, onBack, onLogout }) => {
    return (
        <aside className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col print:hidden">
            <nav className="flex-1 space-y-2">
                <NavItem
                    label="Mapping Workbench"
                    isActive={activePage === 'mapping'}
                    onClick={() => setActivePage('mapping')}
                    icon={<MapIcon className="w-5 h-5" />}
                />
                <NavItem
                    label="Notes Selection"
                    isActive={activePage === 'notes'}
                    onClick={() => setActivePage('notes')}
                    icon={<ListBulletIcon className="w-5 h-5" />}
                />
                <NavItem
                    label="Schedules Entry"
                    isActive={activePage === 'schedules'}
                    onClick={() => setActivePage('schedules')}
                    icon={<FileTextIcon className="w-5 h-5" />}
                />
                <NavItem
                    label="Financial Reports"
                    isActive={activePage === 'reports'}
                    onClick={() => setActivePage('reports')}
                    icon={<BarChartIcon className="w-5 h-5" />}
                />
                <NavItem
                    label="Approval Center"
                    isActive={activePage === 'approval-center'}
                    onClick={() => setActivePage('approval-center')}
                    icon={<ShieldCheckIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />}
                />
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <NavItem
                    label="CARO 2020"
                    isActive={activePage === 'caro'}
                    onClick={() => setActivePage('caro')}
                    icon={<FileTextIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />}
                />
                <NavItem
                    label="Tax Audit (3CD)"
                    isActive={activePage === 'tax-audit'}
                    onClick={() => setActivePage('tax-audit')}
                    icon={<ListBulletIcon className="w-5 h-5 text-green-600 dark:text-green-500" />}
                />
                <NavItem
                    label="Cash Flow Statement"
                    isActive={activePage === 'cash-flow'}
                    onClick={() => setActivePage('cash-flow')}
                    icon={<BarChartIcon className="w-5 h-5 text-blue-600 dark:text-blue-500" />}
                />
                <NavItem
                    label="Book to Tax Bridge"
                    isActive={activePage === 'tax-bridge'}
                    onClick={() => setActivePage('tax-bridge')}
                    icon={<FileTextIcon className="w-5 h-5 text-orange-600 dark:text-orange-500" />}
                />
            </nav>
            <div className="mt-auto space-y-2">
                <button
                    onClick={onBack}
                    className="w-full flex items-center px-4 py-2.5 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span className="ml-3">Back to Dashboard</span>
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-2.5 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span className="ml-3">Logout</span>
                </button>
            </div>
        </aside>
    );
};
