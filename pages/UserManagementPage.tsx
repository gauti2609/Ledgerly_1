import React, { useState, useEffect } from 'react';
import { UserIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as apiService from '../services/apiService';
import { Role } from '../types';

import { FinancialEntity } from '../types';

interface User {
    id: string;
    email: string;
    role: Role;
    entityId?: string;
    createdAt: string;
}

interface UserManagementPageProps {
    token: string;
    onBack: () => void;
    userEmail?: string | null;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ token, onBack, userEmail }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [entities, setEntities] = useState<FinancialEntity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('VIEWER');
    const [entityId, setEntityId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchEntities();
    }, [token]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getUsers(token);
            setUsers(data);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEntities = async () => {
        try {
            const data = await apiService.getEntities(token);
            setEntities(data);
        } catch (err: any) {
            console.error('Failed to fetch entities:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const payload: any = { role };
            // Only send entityId if role is not Tenant/Platform Admin
            if (role !== 'TENANT_ADMIN' && role !== 'PLATFORM_ADMIN') {
                payload.entityId = entityId || null;
            } else {
                payload.entityId = null; // Clear entity if promoting to Admin
            }

            if (password) {
                payload.password = password;
            }

            if (editingUser) {
                await apiService.updateUser(token, editingUser.id, payload);
            } else {
                await apiService.createUser(token, { ...payload, email, password });
            }
            setIsModalOpen(false);
            resetForm();
            fetchUsers();
        } catch (err: any) {
            setError(err.message || 'Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await apiService.deleteUser(token, id);
            fetchUsers();
        } catch (err: any) {
            alert(err.message || 'Failed to delete user');
        }
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setEmail(user.email);
        setRole(user.role);
        setEntityId(user.entityId || '');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingUser(null);
        setEmail('');
        setPassword('');
        setRole('VIEWER');
        setEntityId('');
        setError(null);
    };

    const getEntityName = (id?: string) => {
        if (!id) return '-';
        return entities.find(e => e.id === id)?.name || 'Unknown Entity';
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                    <button onClick={onBack} className="text-gray-400 hover:text-white">
                        <span className="sr-only">Back</span>
                        &larr; Back
                    </button>
                    <h1 className="text-xl font-semibold flex items-center">
                        <UserIcon className="w-6 h-6 mr-2 text-brand-blue" />
                        User Management
                    </h1>
                </div>
                <div className="flex flex-col items-end space-y-2">
                    {userEmail && (
                        <span className="text-xs text-brand-blue-light font-mono bg-gray-900/50 px-2 py-1 rounded border border-brand-blue/30 shadow-sm">
                            {userEmail}
                        </span>
                    )}
                    <div className="flex items-center space-x-3">
                        <button onClick={onBack} className="text-xs font-medium text-gray-400 hover:text-white transition-colors mr-2">
                            &larr; Back
                        </button>
                        <button
                            onClick={() => { resetForm(); setIsModalOpen(true); }}
                            className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                        >
                            <PlusIcon className="w-5 h-5 mr-1" />
                            Add User
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">Loading users...</div>
                ) : (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned Entity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 bg-gray-800">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-750">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'PLATFORM_ADMIN' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'TENANT_ADMIN' ? 'bg-blue-100 text-blue-800' :
                                                        user.role === 'MANAGER' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {getEntityName(user.entityId)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button onClick={() => openEdit(user)} className="text-indigo-400 hover:text-indigo-300">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-300">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-700">
                            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                                            {editingUser ? 'Edit User' : 'Add New User'}
                                        </h3>
                                        {error && <div className="mt-2 text-red-400 text-sm">{error}</div>}
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400">Email</label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    disabled={!!editingUser}
                                                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400">
                                                    {editingUser ? 'New Password (Optional)' : 'Password'}
                                                </label>
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder={editingUser ? 'Leave blank to keep current' : ''}
                                                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400">Role</label>
                                                <select
                                                    value={role}
                                                    onChange={(e) => setRole(e.target.value as Role)}
                                                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                                                >
                                                    <option value="TENANT_ADMIN">Tenant Admin</option>
                                                    <option value="ENTITY_ADMIN">Entity Admin</option>
                                                    <option value="MANAGER">Manager</option>
                                                    <option value="EXECUTIVE">Executive</option>
                                                    <option value="VIEWER">Viewer (Legacy)</option>
                                                </select>
                                            </div>

                                            {(role !== 'TENANT_ADMIN' && role !== 'PLATFORM_ADMIN') && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400">Assign Entity</label>
                                                    <select
                                                        value={entityId}
                                                        onChange={(e) => setEntityId(e.target.value)}
                                                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                                                    >
                                                        <option value="">-- No Entity Assigned --</option>
                                                        {entities.map(entity => (
                                                            <option key={entity.id} value={entity.id}>
                                                                {entity.name} ({entity.entityType})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Note: {role} role requires specific entity scope usually.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-750 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-700">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-blue text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
