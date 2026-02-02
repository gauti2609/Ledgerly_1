import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { VertexAI, GenerativeModel as VertexGenerativeModel } from '@google-cloud/vertexai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel | VertexGenerativeModel;
  private useVertex: boolean = false;

  constructor() {
    const apiKey = process.env.API_KEY;
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION || 'us-central1';

    if (apiKey) {
      this.logger.log('Initializing Google Generative AI (AI Studio) with API Key.');
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      this.useVertex = false;
    } else if (projectId) {
      this.logger.log(`Initializing Vertex AI with Project: ${projectId}, Location: ${location}`);
      const vertexAI = new VertexAI({ project: projectId, location: location });
      this.model = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
      this.useVertex = true;
    } else {
      this.logger.error("Neither API_KEY nor GCP_PROJECT_ID set. AI features will fail.");
    }
  }

  async getMappingSuggestion(ledgerName: string, masters?: any, balance?: number, examples: any[] = []): Promise<{
    majorHeadCode: string;
    minorHeadCode: string;
    groupingCode: string;
    confidence: number;
    reasoning: string;
  }> {
    if (!this.model) {
      throw new Error("AI Model not initialized. Check API_KEY or GCP credentials.");
    }

    // Build context from masters if provided
    let context = '';
    if (masters?.majorHeads && masters?.minorHeads && masters?.groupings) {
      // Use Standard JSON structure for reliability
      const structure = masters.majorHeads.map((maj: any) => ({
        code: maj.code,
        name: maj.name,
        minorHeads: masters.minorHeads
          .filter((min: any) => min.majorHeadCode === maj.code)
          .map((min: any) => ({
            code: min.code,
            name: min.name,
            groupings: masters.groupings
              .filter((grp: any) => grp.minorHeadCode === min.code)
              .map((grp: any) => ({ code: grp.code, name: grp.name }))
          }))
      }));
      context = JSON.stringify(structure);
    }

    // Build examples string
    let examplesContext = '';
    if (examples && examples.length > 0) {
      examplesContext = `
        USER PREFERENCES / HISTORY (Use these as strong guidelines):
        The user has previously mapped similar ledgers as follows:
        ${examples.map(ex => `- "${ex.name}" -> Grouping: ${ex.grouping} (Major: ${ex.majorHead}, Minor: ${ex.minorHead})`).join('\n')}
        `;
    }

    const prompt = `
      You are an expert accountant mapping ledgers to Schedule III financial heads.
      
      Task: Suggest the mapping for the ledger: "${ledgerName}"
      Ledger Balance: ${balance !== undefined ? balance : 'Not provided'}
      
      CRITICAL CLASSIFICATION RULE:
      - NEGATIVE balance (< 0) = This ledger is a LIABILITY or INCOME item
      - POSITIVE balance (> 0) = This ledger is an ASSET or EXPENSE item
      
      This rule MUST guide your major head selection:
      - For NEGATIVE balances: Choose from "Equity and Liabilities" or Income-related heads
      - For POSITIVE balances: Choose from "Assets" or Expense-related heads
      
      Available Financial Structure (JSON):
      ${context}

      ${examplesContext}

      Instructions:
      1. First, determine if the ledger is Liability/Income (negative) or Asset/Expense (positive) based on balance.
      2. Traverse the structure to find the most specific Grouping Code that fits.
      3. Return the codes for Major Head, Minor Head, and Grouping EXACTLY as found in the structure.
      4. If no exact match, choose the closest generic grouping.
      5. Provide a confidence score (0-1) and reasoning.

      Output JSON Schema:
      {
        "majorHeadCode": "string",
        "minorHeadCode": "string",
        "groupingCode": "string",
        "confidence": number,
        "reasoning": "string"
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = '';

      if (this.useVertex) {
        // Vertex SDK structure
        text = (response as any).candidates[0].content.parts[0].text;
      } else {
        // AI Studio SDK structure
        text = (response as any).text();
      }

      // Clean markdown if present
      let jsonString = text.replace(/```json\n?|\n?```/g, '').trim();

      // Extract only the JSON object (AI sometimes adds trailing explanation text)
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }

      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.error(`Error generating mapping suggestion: ${error.message} `, error.stack);
      // Return a safe fallback or throw
      throw error;
    }
  }

  async getBatchMappingSuggestions(ledgers: Array<{ name: string; balance: number }>, masters?: any, examples: any[] = []): Promise<any[]> {
    if (!this.model) {
      throw new Error("AI Model not initialized.");
    }

    // Build context from masters
    let context = '';
    if (masters?.majorHeads && masters?.minorHeads && masters?.groupings) {
      const structure = masters.majorHeads.map((maj: any) => ({
        code: maj.code,
        name: maj.name,
        minorHeads: masters.minorHeads
          .filter((min: any) => min.majorHeadCode === maj.code)
          .map((min: any) => ({
            code: min.code,
            name: min.name,
            groupings: masters.groupings
              .filter((grp: any) => grp.minorHeadCode === min.code)
              .map((grp: any) => ({ code: grp.code, name: grp.name }))
          }))
      }));
      context = JSON.stringify(structure);
    }

    // Build examples string
    let examplesContext = '';
    if (examples && examples.length > 0) {
      examplesContext = `
        USER PREFERENCES / HISTORY (Use these as strong guidelines):
        The user has previously mapped similar ledgers as follows:
        ${examples.map(ex => `- "${ex.name}" -> Grouping: ${ex.grouping} (Major: ${ex.majorHead}, Minor: ${ex.minorHead})`).join('\n')}
        
        INSTRUCTION: If a ledger relies on a specific user pattern shown above, REPLICATE that pattern.
        `;
    }

    // Build ledger list with balances
    const ledgerList = ledgers.map(l => `- "${l.name}" (Balance: ${l.balance})`).join('\n');

    const prompt = `
You are an expert accountant mapping ledgers to Schedule III financial heads.

TASK: Suggest mappings for ALL the following ledgers:
${ledgerList}

CRITICAL CLASSIFICATION RULE:
- NEGATIVE balance (< 0) = LIABILITY or INCOME
- POSITIVE balance (> 0) = ASSET or EXPENSE

IMPORTANT CONSISTENCY RULES:
1. **Pattern Recognition**: Look for common prefixes/patterns in ledger names (e.g., "ALTERIAFUND", "BANK", "GST Input"). 
2. **Uniform Treatment**: ALL ledgers with similar names/patterns MUST receive the SAME mapping classification.
3. **Research Context**: If a name suggests a known financial instrument (e.g., "ALTERIA" is a lending fund), classify appropriately.
4. **Balance Sign**: Use balance sign to determine Asset/Liability classification.

Available Financial Structure (JSON):
${context}

${examplesContext}

OUTPUT FORMAT - Return a JSON array with one object per ledger:
[
  {
    "ledgerName": "exact ledger name",
    "majorHeadCode": "code from structure",
    "minorHeadCode": "code from structure", 
    "groupingCode": "code from structure",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation"
  }
]

RETURN ONLY THE JSON ARRAY, NO OTHER TEXT.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = '';

      if (this.useVertex) {
        text = (response as any).candidates[0].content.parts[0].text;
      } else {
        text = (response as any).text();
      }

      // Extract JSON array
      let jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
      const firstBracket = jsonString.indexOf('[');
      const lastBracket = jsonString.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        jsonString = jsonString.substring(firstBracket, lastBracket + 1);
      }

      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.error(`Batch suggestion error: ${error.message}`);
      // Fallback to individual processing
      const results = [];
      for (const ledger of ledgers) {
        try {
          const res = await this.getMappingSuggestion(ledger.name, masters, ledger.balance, examples);
          results.push({ ledgerName: ledger.name, ...res });
        } catch (e) {
          results.push({ ledgerName: ledger.name, error: e.message });
        }
      }
      return results;
    }
  }

  async getChatResponse(message: string, previousHistory: any[] = []) {
    if (!this.model) {
      throw new Error("AI Model not initialized.");
    }

    // Map history to appropriate format
    let formattedHistory = previousHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.parts[0].text }]
    }));

    // IMPORTANT: Gemini API requires history to start with 'user'.
    // Remove any leading 'model' messages (like the initial greeting from Chatbot).
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const chat = this.model.startChat({
      history: formattedHistory,
    });

    try {
      const result = await chat.sendMessage(message);
      const response = await result.response;

      if (this.useVertex) {
        return (response as any).candidates[0].content.parts[0].text;
      } else {
        return (response as any).text();
      }
    } catch (error) {
      this.logger.error(`Error in chat: ${error.message} `);
      throw error;
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.model) {
      throw new Error("AI Model not initialized.");
    }
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      if (this.useVertex) {
        return (response as any).candidates[0].content.parts[0].text;
      } else {
        return (response as any).text();
      }
    } catch (error) {
      this.logger.error(`Error generating text: ${error.message} `);
      throw error;
    }
  }
}
