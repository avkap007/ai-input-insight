
/**
 * Utility functions for making API calls to external services
 */

// Anthropic API client for Claude AI
export const anthropicClient = {
  generateResponse: async (
    apiKey: string,
    messages: { role: string; content: string }[],
    systemPrompt: string
  ) => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          system: systemPrompt,
          messages: messages,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Anthropic API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error calling Anthropic API:", error);
      throw error;
    }
  }
};

// Content analysis client
export const analysisClient = {
  analyzeSentiment: (text: string) => {
    // Implementation from contentAnalysis.ts
    return analyzeSentiment(text);
  },
  
  detectBias: (text: string) => {
    // Implementation from contentAnalysis.ts
    return detectBias(text);
  },
  
  calculateTrustScore: (baseKnowledgePercentage: number, documentContributions: { contribution: number }[]) => {
    // Implementation from contentAnalysis.ts
    return calculateTrustScore(baseKnowledgePercentage, documentContributions);
  }
};

// Import the local implementations for content analysis
import { 
  analyzeSentiment, 
  detectBias, 
  calculateTrustScore 
} from './contentAnalysis';
