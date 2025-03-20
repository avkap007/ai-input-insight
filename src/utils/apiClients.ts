
/**
 * Utility functions for making API calls to external services
 */

// Document management API client
export const documentClient = {
  uploadDocuments: async (documents: any[]) => {
    try {
      const response = await fetch('/api/upload-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documents })
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading documents:", error);
      throw error;
    }
  }
};

// Response generation API client
export const responseClient = {
  generateResponse: async (query: string, documents: any[]) => {
    try {
      const response = await fetch('/api/generate-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          query, 
          documents 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Response generation failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Response generation failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  }
};

// Content analysis API client
export const analysisClient = {
  analyzeResponse: async (generatedText: string) => {
    try {
      const response = await fetch('/api/analyze-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ generated_text: generatedText })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the data to match our application's expected format
      return {
        sentiment: data.sentiment_value || 0,
        bias: data.bias_indicators || {},
        trustScore: data.trust_score / 100 || 0.5
      };
    } catch (error) {
      console.error("Error analyzing response:", error);
      throw error;
    }
  }
};

// Legacy implementation for content analysis
// These are implemented locally in case the API is unavailable
import { 
  analyzeSentiment, 
  detectBias, 
  calculateTrustScore 
} from './contentAnalysis';

// Fallback content analysis client (local implementation)
export const localAnalysisClient = {
  analyzeSentiment: (text: string) => {
    return analyzeSentiment(text);
  },
  
  detectBias: (text: string) => {
    return detectBias(text);
  },
  
  calculateTrustScore: (baseKnowledgePercentage: number, documentContributions: { contribution: number }[]) => {
    return calculateTrustScore(baseKnowledgePercentage, documentContributions);
  }
};
