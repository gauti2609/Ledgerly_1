import { fetchWithAuth } from './apiService';
import { Masters, MappingSuggestion } from '../types.ts';

const API_URL = '/api';

/**
 * Gets an AI-powered mapping suggestion for a trial balance ledger.
 * Delegates to the backend AI service.
 */
export const getMappingSuggestion = async (
  token: string,
  ledgerName: string,
  masters: Masters,
): Promise<MappingSuggestion | null> => {
  try {
    const response = await fetchWithAuth(
      `${API_URL}/ai/suggest-mapping`,
      {
        method: 'POST',
        body: JSON.stringify({ ledgerName, masters }),
      },
      token
    );
    return response as MappingSuggestion;
  } catch (error) {
    console.error('Error getting AI suggestion from backend:', error);
    return null;
  }
};

/**
 * Gets AI mapping suggestions for a batch of ledgers.
 * Now includes balance to guide AI classification.
 */
export const getBatchMappingSuggestions = async (
  token: string,
  ledgers: Array<{ name: string; balance: number }>,
  masters: Masters,
): Promise<Record<string, MappingSuggestion> | null> => {
  try {
    const response = await fetchWithAuth(
      `${API_URL}/ai/suggest-mapping-batch`,
      {
        method: 'POST',
        body: JSON.stringify({ ledgers, masters }),
      },
      token
    );

    // Backend returns array of object { ledgerName, ...MappingSuggestion }
    // Convert to record
    if (Array.isArray(response)) {
      const result: Record<string, MappingSuggestion> = {};
      response.forEach((item: any) => {
        const { ledgerName, ...suggestion } = item;
        result[ledgerName] = suggestion as MappingSuggestion;
      });
      return result;
    }
    return null;
  } catch (error) {
    console.error('Error getting batch suggestions:', error);
    return null;
  }
};

/**
 * Gets a response from the chatbot.
 */
export const getChatResponse = async (
  token: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
): Promise<string> => {
  try {
    // The backend expects the LATEST message to be 'message' field, and 'history' to be previous.
    // Frontend passes full history including the latest user message.

    const lastMessage = history[history.length - 1];
    const previousHistory = history.slice(0, history.length - 1);

    // Ensure last message is from user
    if (!lastMessage || lastMessage.role !== 'user') {
      console.warn("Last message in history is not user, likely duplication or initial state error");
      // fallback: send an empty string or handle gracefully? 
      // If empty, just return empty.
      if (!lastMessage) return "";
    }

    const messageText = lastMessage.parts[0].text;

    const response = await fetchWithAuth(
      `${API_URL}/ai/chat`,
      {
        method: 'POST',
        body: JSON.stringify({
          message: messageText,
          history: previousHistory
        }),
      },
      token
    );

    return response?.text || "Sorry, I received an empty response.";
  } catch (error) {
    console.error("Chat API Error:", error);
    return "Sorry, I encountered an error communicating with the AI server.";
  }
};

export const generateText = async (
  token: string,
  prompt: string,
): Promise<string> => {
  try {
    const response = await fetchWithAuth(
      `${API_URL}/ai/generate-text`,
      {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      },
      token
    );
    return response || "";
  } catch (error) {
    console.error("Generate Text Error:", error);
    return "";
  }
};
