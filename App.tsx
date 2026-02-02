import React, { useState, useEffect } from 'react';
import { Page, AllData, TrialBalanceItem, Masters, ScheduleData, EntityType, FinancialEntity, Role } from './types.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { MainApp } from './components/MainApp.tsx';
import { ConsolidationPage } from './pages/ConsolidationPage.tsx';
import * as apiService from './services/apiService.ts';

import { AuditLogPage } from './pages/AuditLogPage.tsx';
import { LicensePage } from './pages/LicensePage.tsx';
import { getUserIdFromToken, getUserEmailFromToken } from './utils/jwt.ts';
import { ApprovalWorkflow } from './components/ApprovalWorkflow.tsx';

import { UserManagementPage } from './pages/UserManagementPage.tsx';
import { ThemeSwitcher } from './components/ThemeSwitcher.tsx';

function App() {
  const [token, setToken] = useState<string | null>(window.localStorage.getItem('token'));
  const [role, setRole] = useState<Role | null>(window.localStorage.getItem('role') as Role);
  const [selectedEntity, setSelectedEntity] = useState<FinancialEntity | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [showConsolidation, setShowConsolidation] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [entities, setEntities] = useState<FinancialEntity[]>([]);

  // Fetch entities when logged in
  useEffect(() => {
    if (token) {
      apiService.getEntities(token).then(setEntities).catch(console.error);
    }
  }, [token]);

  const handleLogin = (newToken: string, newRole: Role) => {
    window.localStorage.setItem('token', newToken);
    window.localStorage.setItem('role', newRole);
    setToken(newToken);
    setRole(newRole);
  };

  const handleLogout = () => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('role');
    window.localStorage.removeItem('lastEntityId');
    setToken(null);
    setRole(null);
    setSelectedEntity(null);
  };

  // Persistence Logic
  useEffect(() => {
    if (token) {
      const savedEntityId = window.localStorage.getItem('lastEntityId');
      if (savedEntityId) {
        // We need to fetch basic entity info to set it
        // Optimization: We could store the whole entity in localStorage, but fetching ensures freshness
        apiService.getEntities(token).then(all => {
          const found = all.find(e => e.id === savedEntityId);
          if (found) setSelectedEntity(found);
        }).catch(e => {
          console.error("Failed to restore session entity", e);
          window.localStorage.removeItem('lastEntityId');
        });
      }
    }
  }, [token]);

  const handleSelectEntity = (entity: FinancialEntity) => {
    window.localStorage.setItem('lastEntityId', entity.id);
    setSelectedEntity(entity);
  };

  const handleBackToDashboard = () => {
    window.localStorage.removeItem('lastEntityId');
    setSelectedEntity(null);
  };

  if (!token) {
    return (
      <>
        <AuthPage onLogin={handleLogin} />
        <ThemeSwitcher />
      </>
    );
  }

  const userEmail = token ? getUserEmailFromToken(token) : null;

  if (showAuditLogs) {
    return (
      <>
        <AuditLogPage token={token} onBack={() => setShowAuditLogs(false)} userEmail={userEmail} />
        <ThemeSwitcher />
      </>
    );
  }

  if (showLicense) {
    return (
      <>
        <LicensePage token={token} onBack={() => setShowLicense(false)} userEmail={userEmail} />
        <ThemeSwitcher />
      </>
    );
  }

  if (showUserManagement) {
    return (
      <>
        <UserManagementPage token={token} onBack={() => setShowUserManagement(false)} userEmail={userEmail} />
        <ThemeSwitcher />
      </>
    );
  }

  if (showConsolidation) {
    return (
      <>
        <ConsolidationPage token={token} entities={entities} onBack={() => setShowConsolidation(false)} userEmail={userEmail} />
        <ThemeSwitcher />
      </>
    );
  }

  if (showApprovals) {
    return (
      <>
        <div className="flex h-screen bg-gray-900 text-gray-200">
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="flex flex-col items-end mb-4 space-y-2">
              {userEmail && (
                <span className="text-xs text-brand-blue-light font-mono bg-gray-900/50 px-2 py-1 rounded border border-brand-blue/30 shadow-sm">
                  {userEmail}
                </span>
              )}
              <button onClick={() => setShowApprovals(false)} className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
                &larr; Back to Dashboard
              </button>
            </div>
            <h1 className="text-2xl font-bold mb-6">Global Approval Center</h1>
            <ApprovalWorkflow
              token={token}
              role={role}
              currentUserId={getUserIdFromToken(token) || ''}
            />
          </div>
        </div>
        <ThemeSwitcher />
      </>
    );
  }

  if (!selectedEntity) {
    return (
      <>
        <DashboardPage
          token={token}
          role={role}
          userEmail={userEmail}
          onSelectEntity={handleSelectEntity}
          onShowAuditLogs={() => setShowAuditLogs(true)}
          onShowLicense={() => setShowLicense(true)}
          onShowConsolidation={() => setShowConsolidation(true)}
          onShowUserManagement={() => setShowUserManagement(true)}
          onShowApprovals={() => setShowApprovals(true)}
          onLogout={handleLogout}
        />
        <ThemeSwitcher />
      </>
    );
  }

  return (
    <>
      <MainApp entity={selectedEntity} entities={entities} onBack={handleBackToDashboard} onSelectEntity={handleSelectEntity} onLogout={handleLogout} token={token} role={role} userEmail={userEmail} />
      <ThemeSwitcher />
    </>
  );
}

export default App;
