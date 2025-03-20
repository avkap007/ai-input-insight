const API_BASE_URL = "http://127.0.0.1:8000";

// Document API Client
export const documentClient = {
  uploadDocument: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload-document`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Upload error:", error);
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
        throw new Error("Update failed");
      }
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
        throw new Error("Deletion failed");
      }
    } catch (error) {
      console.error("Document deletion error:", error);
      throw error;
    }
  },
};
export const responseClient = {
  generateResponse: async (query: string, documents: any[]) => {
    try {
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

      return await response.json();
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  },
};
