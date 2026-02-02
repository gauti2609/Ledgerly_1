import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '../components/icons.tsx';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
    userId: string;
    timestamp: string;
    user: {
        email: string;
        role: string;
    }
}

interface AuditLogPageProps {
    token: string;
    onBack: () => void;
    userEmail?: string | null;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ token, onBack, userEmail }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch('/api/audit', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch logs');
                const data = await response.json();
                setLogs(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-8">
            <header className="flex justify-between items-start mb-8">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
                    </button>
                    <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                </div>
                <div className="flex flex-col items-end space-y-2">
                    {userEmail && (
                        <span className="text-xs text-brand-blue-light font-mono bg-gray-900/50 px-2 py-1 rounded border border-brand-blue/30 shadow-sm">
                            {userEmail}
                        </span>
                    )}
                    <button onClick={onBack} className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
                        &larr; Back to Dashboard
                    </button>
                </div>
            </header>

            {loading && <div>Loading logs...</div>}
            {error && <div className="text-red-400">{error}</div>}

            {!loading && !error && (
                <div className="overflow-x-auto bg-gray-800 rounded-lg border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700 text-sm">
                        <thead className="bg-gray-700 text-gray-300">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Entity</th>
                                <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-750">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                                        {log.user.email} <span className="text-xs text-brand-blue-light ml-1">({log.user.role})</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-blue-400 font-semibold">{log.action}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{log.entityType} {log.entityId ? `(${log.entityId.substring(0, 8)})` : ''}</td>
                                    <td className="px-6 py-4 text-gray-500 truncate max-w-xs" title={log.details}>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
