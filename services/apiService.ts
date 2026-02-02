import { Masters, MappingSuggestion, FinancialEntity, EntityType, AllData, Role, ConsolidationGroup } from '../types.ts';

const API_URL = '/api'; // Assuming the frontend is served by the same server as the backend API

// -- Report APIs --
export const getCaroReport = async (token: string, entityId: string) => {
  return await fetchWithAuth(`${API_URL}/reports/caro/${entityId}`, { method: 'GET' }, token);
};

export const saveCaroReport = async (token: string, entityId: string, clauseData: any) => {
  return await fetchWithAuth(`${API_URL}/reports/caro/${entityId}`, {
    method: 'POST',
    body: JSON.stringify({ clauseData })
  }, token);
};

export const getTaxAuditReport = async (token: string, entityId: string) => {
  return await fetchWithAuth(`${API_URL}/reports/tax-audit/${entityId}`, { method: 'GET' }, token);
};

export const saveTaxAuditReport = async (token: string, entityId: string, clauseData: any) => {
  return await fetchWithAuth(`${API_URL}/reports/tax-audit/${entityId}`, {
    method: 'POST',
    body: JSON.stringify({ clauseData })
  }, token);
};

export async function fetchWithAuth(url: string, options: RequestInit = {}, token: string) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    // For DELETE requests, a 204 No Content is a success but response.json() will fail.
    if (response.status === 204) {
      return null;
    }
    const text = await response.text();
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || 'An API error occurred');
    } catch (e: any) {
      // If JSON parse fails, throw the text content or status text
      if (e.message !== 'An API error occurred' && !e.message.includes('JSON')) {
        throw e; // Rethrow if it was our parsed error
      }
      throw new Error(text || `API Error: ${response.status} ${response.statusText}`);
    }
  }
  // Handle cases where the response might be empty
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// --- Auth ---
export const login = async (email: string, password: string): Promise<{ access_token: string; role: Role }> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }
  const text = await response.text();
  console.log('Login Raw Response:', text);
  if (!text) {
    throw new Error('Empty response from login server');
  }
  return JSON.parse(text);
};

export const register = async (email: string, password: string): Promise<any> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Registration failed');
  }
  return response.json();
};

// --- Entities ---
export const getEntities = (token: string): Promise<FinancialEntity[]> => {
  return fetchWithAuth(`${API_URL}/entities`, {}, token);
};

export const createEntity = (token: string, name: string, entityType: EntityType, financialYear?: string, confirmNew?: boolean, linkToCode?: string): Promise<any> => {
  return fetchWithAuth(`${API_URL}/entities`, {
    method: 'POST',
    body: JSON.stringify({ name, entityType, financialYear, confirmNew, linkToCode }),
  }, token);
};

export const getEntityData = (token: string, entityId: string): Promise<AllData> => {
  return fetchWithAuth(`${API_URL}/entities/${entityId}`, {}, token);
};

export const updateEntity = (token: string, entityId: string, data: AllData): Promise<FinancialEntity> => {
  return fetchWithAuth(`${API_URL}/entities/${entityId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
};

export const deleteEntity = (token: string, entityId: string): Promise<null> => {
  return fetchWithAuth(`${API_URL}/entities/${entityId}`, {
    method: 'DELETE',
  }, token);
}


// --- AI Service ---
// This has been moved to services/geminiService.ts

// --- Global Masters ---
/**
 * Sync a new grouping to the global masters so it's available for all entities.
 */
export const addGlobalGrouping = async (
  token: string,
  grouping: { code: string; name: string; minorHeadCode: string }
): Promise<void> => {
  await fetchWithAuth(`${API_URL}/masters/add-grouping`, {
    method: 'POST',
    body: JSON.stringify(grouping),
  }, token);
};

// Sync masters to the updated 153 groupings structure
export const syncMasters = (token: string): Promise<{ message: string; entitiesUpdated: number }> => {
  return fetchWithAuth(`${API_URL}/masters/sync`, {
    method: 'POST',
  }, token);
};

// --- Consolidation Groups ---

export const getConsolidationGroups = (token: string): Promise<ConsolidationGroup[]> => {
  return fetchWithAuth(`${API_URL}/consolidation-groups`, {}, token);
};

export const getConsolidationGroup = (token: string, groupId: string): Promise<ConsolidationGroup> => {
  return fetchWithAuth(`${API_URL}/consolidation-groups/${groupId}`, {}, token);
};

export const createConsolidationGroup = (token: string, group: ConsolidationGroup): Promise<ConsolidationGroup> => {
  return fetchWithAuth(`${API_URL}/consolidation-groups`, {
    method: 'POST',
    body: JSON.stringify(group),
  }, token);
};

export const updateConsolidationGroup = (token: string, groupId: string, group: ConsolidationGroup): Promise<ConsolidationGroup> => {
  return fetchWithAuth(`${API_URL}/consolidation-groups/${groupId}`, {
    method: 'PUT',
    body: JSON.stringify(group),
  }, token);
};

export const deleteConsolidationGroup = (token: string, groupId: string): Promise<null> => {
  return fetchWithAuth(`${API_URL}/consolidation-groups/${groupId}`, {
    method: 'DELETE',
  }, token);
};

// --- User Management ---
export const getUsers = async (token: string) => {
  return await fetchWithAuth(`${API_URL}/users`, {}, token);
};

export const createUser = async (token: string, userData: any) => {
  return await fetchWithAuth(`${API_URL}/users`, {
    method: 'POST',
    body: JSON.stringify(userData),
  }, token);
};

export const updateUser = async (token: string, id: string, userData: any) => {
  return await fetchWithAuth(`${API_URL}/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }, token);
};

export const deleteUser = async (token: string, id: string) => {
  return await fetchWithAuth(`${API_URL}/users/${id}`, {
    method: 'DELETE',
  }, token);
};


// --- Pending Changes ---
export const getPendingChanges = async (token: string, entityId: string): Promise<any[]> => {
  return await fetchWithAuth(`${API_URL}/pending-changes/${entityId}`, {}, token);
};

export const createPendingChange = async (token: string, data: { financialEntityId: string; userId: string; type: string; data: any }): Promise<any> => {
  return await fetchWithAuth(`${API_URL}/pending-changes`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

export const reviewPendingChange = async (token: string, changeId: string, reviewerId: string, status: 'APPROVED' | 'REJECTED'): Promise<any> => {
  return await fetchWithAuth(`${API_URL}/pending-changes/${changeId}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewerId, status }),
  }, token);
};

export const getGlobalPendingChanges = async (token: string): Promise<any[]> => {
  return await fetchWithAuth(`${API_URL}/pending-changes`, { method: 'GET' }, token);
};


