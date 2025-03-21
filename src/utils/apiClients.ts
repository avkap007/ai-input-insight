
// Use the correct API base URL
const API_BASE_URL = "http://127.0.0.1:8000";

// Document API Client
export const documentClient = {
  uploadDocument: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upload failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  },

  getDocuments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  },

  updateDocumentInfluence: async (id: string, influenceScore: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/update-influence/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ influence: influenceScore }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Update failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error("Update failed");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Influence update error:", error);
      throw error;
    }
  },

  deleteDocument: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/delete-document/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Deletion failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error("Deletion failed");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Document deletion error:", error);
      throw error;
    }
  },
};

export const responseClient = {
  generateResponse: async (query: string, documents: any[]) => {
    try {
      console.log(`Sending request with ${documents.length} documents`, { query, documents });
      
      const response = await fetch(`${API_BASE_URL}/generate-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, documents }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Response generation failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Response generation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Response generation succeeded:", data);
      return data;
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  },
};

export const analysisClient = {
  analyzeSentiment: async (text: string) => {
    try {
      if (!text) {
        console.warn("Empty text provided for sentiment analysis");
        return 0;
      }
      
      const response = await fetch(`${API_BASE_URL}/analyze-sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Sentiment analysis failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error("Sentiment analysis failed");
      }

      const data = await response.json();
      return data.sentiment_score;
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      return 0;
    }
  },
  
  detectBias: async (text: string) => {
    try {
      if (!text) {
        console.warn("Empty text provided for bias detection");
        return { political: 0.2 };
      }
      
      const response = await fetch(`${API_BASE_URL}/detect-bias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Bias detection failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error("Bias detection failed");
      }

      const data = await response.json();
      return data.bias_scores;
    } catch (error) {
      console.error("Error detecting bias:", error);
      return { political: 0.2 };
    }
  },
  
  calculateTrustScore: async (baseKnowledgePercentage: number, documentContributions: any[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/calculate-trust-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseKnowledgePercentage, documentContributions }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Trust score calculation failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error("Trust score calculation failed");
      }

      const data = await response.json();
      return data.trust_score;
    } catch (error) {
      console.error("Error calculating trust score:", error);
      return 0.5;
    }
  },
};
