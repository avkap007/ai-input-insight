import { Document } from "@/types";

// Base URL for API endpoints - use relative URLs in production, localhost in development
const API_BASE_URL = import.meta.env.DEV ? "http://127.0.0.1:8000" : "/api";

/**
 * Client for document text extraction (stateless - no storage)
 */
export const documentClient = {
  // Extract text from uploaded file
  extractText: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/extract-text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to extract text from document');
      return await response.json();
    } catch (error) {
      console.error('Error extracting text:', error);
      throw error;
    }
  },

  // Upload a document (same as extractText, kept for API compatibility)
  uploadDocument: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/extract-text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload document');
      return await response.json();
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Get all documents
  getDocuments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to get documents');
      return await response.json();
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  },

  // Delete a document
  deleteDocument: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete document');
      return await response.json();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  // Update document influence
  updateDocumentInfluence: async (id: string, influenceScore: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}/influence`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ influence_score: influenceScore }),
      });

      if (!response.ok) throw new Error('Failed to update document influence');
      return await response.json();
    } catch (error) {
      console.error('Error updating document influence:', error);
      throw error;
    }
  },
};

/**
 * Client for AI response generation
 */
export const responseClient = {
  // Generate a response based on documents and query
  generateResponse: async (prompt: string, documents: Document[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: prompt,
          documents: documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            content: doc.content,
            influence: doc.influenceScore || 0.5,
            poisoning_level: doc.poisoningLevel || 0,
            excluded: doc.excluded || false
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  },
};

/**
 * Client for text analysis endpoints
 */
export const analysisClient = {
  // Analyze sentiment of text
  analyzeSentiment: async (text: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-sentiment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.sentiment_score || 0;
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      return 0;
    }
  },

  // Detect bias in text
  detectBias: async (text: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/detect-bias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error detecting bias:", error);
      return { bias_scores: { political: 0.2, gender: 0.1 } };
    }
  },

  // Calculate trust score
  calculateTrustScore: async (
    baseKnowledgePercentage: number,
    documentContributions: { id: string; name: string; contribution: number }[]
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/calculate-trust-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseKnowledgePercentage,
          documentContributions,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.trust_score || 0.5;
    } catch (error) {
      console.error("Error calculating trust score:", error);
      return 0.5;
    }
  },
};
