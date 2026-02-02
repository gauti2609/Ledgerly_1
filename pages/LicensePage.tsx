import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '../components/icons.tsx';

interface LicenseStatus {
    isValid: boolean;
    key: string;
    plan: string;
    expiryDate: string;
}

interface LicensePageProps {
    token: string;
    onBack: () => void;
    userEmail?: string | null;
}

export const LicensePage: React.FC<LicensePageProps> = ({ token, onBack, userEmail }) => {
    const [status, setStatus] = useState<LicenseStatus | null>(null);
    const [newKey, setNewKey] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/license/status');
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const res = await fetch('/api/license/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key: newKey })
            });

            if (!res.ok) throw new Error('Failed to update license');

            const data = await res.json();
            setStatus(data);
            setMessage('License updated successfully!');
            setNewKey('');
        } catch (err: any) {
            setError(err.message);
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-8">
            <header className="flex justify-between items-start mb-8">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
                    </button>
                    <h1 className="text-2xl font-bold text-white">License Management</h1>
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

            <div className="max-w-xl mx-auto space-y-8">
                <div className={`p-6 rounded-lg border ${status?.isValid ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
                    <h2 className="text-xl font-bold mb-4">{status?.isValid ? 'Active License' : 'License Expired / Invalid'}</h2>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-gray-400">Current Key:</span> {status?.key}</p>
                        <p><span className="text-gray-400">Plan:</span> {status?.plan}</p>
                        <p><span className="text-gray-400">Expires:</span> {status?.expiryDate ? new Date(status.expiryDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4">Update License Key</h3>
                    {message && <p className="text-green-400 text-sm mb-4">{message}</p>}
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                    <form onSubmit={handleUpdate} className="flex gap-4">
                        <input
                            type="text"
                            value={newKey}
                            onChange={e => setNewKey(e.target.value)}
                            placeholder="Enter new license key..."
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:border-brand-blue"
                            required
                        />
                        <button type="submit" className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-md transition">
                            Update
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
