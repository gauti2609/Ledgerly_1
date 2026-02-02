
import React, { useState, useEffect } from 'react';
import { Role } from '../types.ts';
import * as apiService from '../services/apiService.ts';
import { getPendingChanges, reviewPendingChange } from '../services/apiService.ts';

interface ApprovalWorkflowProps {
    entityId?: string; // Optional for global view
    token: string;
    role: Role | null;
    currentUserId: string;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({ entityId, token, role, currentUserId }) => {
    const [changes, setChanges] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchChanges = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // If entityId is provided, get for that entity. Otherwise get all (global)
            const data = entityId
                ? await getPendingChanges(token, entityId)
                : await apiService.getGlobalPendingChanges(token); // We'll need to add this to apiService
            setChanges(data.filter((c: any) => c.status === 'PENDING'));
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch pending changes');
            setChanges([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChanges();
    }, [token, entityId]);

    const handleReview = async (changeId: string, status: 'APPROVED' | 'REJECTED') => {
        if (!token || !currentUserId) {
            alert("User ID missing. Cannot review.");
            return;
        }
        try {
            await reviewPendingChange(token, changeId, currentUserId, status);
            fetchChanges();
            alert(`Change ${status.toLowerCase()} successfully.`);
        } catch (err: any) {
            alert(`Failed to review: ${err.message}`);
        }
    };

    if (loading) return <div className="text-white p-6">Loading pending changes...</div>;

    const canReview = role === 'MANAGER' || role === 'ENTITY_ADMIN' || role === 'TENANT_ADMIN' || role === 'PLATFORM_ADMIN';

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Approvals Center</h3>
                <button onClick={fetchChanges} className="text-sm text-brand-blue hover:text-white">Refresh</button>
            </div>

            {error && <div className="text-red-400 mb-4 p-3 bg-red-900/20 rounded border border-red-900">{error}</div>}

            {changes.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                    <p className="text-lg">No pending changes found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {changes.map(change => (
                        <div key={change.id} className="bg-gray-700/50 p-4 rounded border border-gray-600 flex flex-col md:flex-row justify-between items-start gap-4 transition hover:bg-gray-700">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-2 mb-2">
                                    <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${change.type === 'MAPPING' ? 'bg-purple-900 text-purple-200' :
                                        change.type === 'NOTE_EDIT' ? 'bg-yellow-900 text-yellow-200' :
                                            'bg-blue-900 text-blue-200'
                                        }`}>
                                        {change.type}
                                    </span>
                                    <span className="text-gray-400 text-sm">Requested by: <span className="text-white">{change.creator?.email || change.userId}</span></span>
                                    <span className="text-gray-500 text-xs">• {new Date(change.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="bg-gray-900 p-3 rounded overflow-x-auto border border-gray-800">
                                    <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap break-all">
                                        {JSON.stringify(change.data, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            {canReview && (
                                <div className="flex flex-col space-y-2 min-w-[100px]">
                                    <button
                                        onClick={() => handleReview(change.id, 'APPROVED')}
                                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded transition shadow-sm"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReview(change.id, 'REJECTED')}
                                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded transition shadow-sm"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
