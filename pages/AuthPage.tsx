import React, { useState } from 'react';
import * as apiService from '../services/apiService.ts';

import { Role } from '../types.ts';

interface AuthPageProps {
  onLogin: (token: string, role: Role) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  // const [isLoginView, setIsLoginView] = useState(true); // Always login view now
  const isLoginView = true;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLoginView) {
        const data = await apiService.login(email, password);
        onLogin(data.access_token, data.role);
      } else {
        await apiService.register(email, password);
        // After successful registration, attempt to log in automatically
        const data = await apiService.login(email, password);
        onLogin(data.access_token, data.role);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <h1 className="text-2xl font-bold text-center text-white">
          {isLoginView ? 'Welcome to Ledgerly' : 'Create an Account'}
        </h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 font-bold text-white bg-brand-blue rounded-md hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-600"
            >
              {isLoading ? 'Loading...' : (isLoginView ? 'Login' : 'Register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
