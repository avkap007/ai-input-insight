import { AttributionData, Document } from "@/types";

// Base URL for API endpoints
const API_BASE_URL = "http://127.0.0.1:8000";

/**
 * Client for interacting with document-related API endpoints
 */
export const documentClient = {
  // Get all documents
  getDocuments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return await response.json();
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Upload a document
  uploadDocument: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload-document`, {
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

  // Delete a document
  deleteDocument: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/delete-document/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/update-influence/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ influence: influenceScore }),
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
 * Client for interacting with response generation API endpoints
 */
export const responseClient = {
  // Generate a response based on documents
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
            content: doc.content,
            name: doc.name,
            influence: doc.influenceScore,
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
 * Client for interacting with analysis-related API endpoints
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
      return 0; // Neutral sentiment as fallback
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
      return { bias_scores: { political: 0.2, gender: 0.1 } }; // Fallback values
    }
  },

  // Calculate trust score based on attribution data
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
          baseKnowledgePercentage: baseKnowledgePercentage,
          documentContributions: documentContributions,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.trust_score || 0.5;
    } catch (error) {
      console.error("Error calculating trust score:", error);
      return 0.5; // Medium trust as fallback
    }
  },
};
