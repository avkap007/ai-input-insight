import { useState, useEffect } from "react";
import { Document } from "@/types";
import { toast } from "@/components/ui/use-toast";

const API_BASE_URL = "http://127.0.0.1:8000";

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);

  // Fetch documents from FastAPI on load
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/documents`);
        if (!response.ok) throw new Error("Failed to fetch documents");
        const data = await response.json();
        setDocuments(data);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast({ title: "Error", description: "Failed to load documents.", variant: "destructive" });
      }
    };
    fetchDocuments();
  }, []);

  // Handle document upload
  const handleDocumentUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload-document`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const savedDocument = await response.json();
      setDocuments((prev) => [...prev, savedDocument]);

      toast({ title: "Document uploaded", description: "Your document has been added successfully." });
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({ title: "Upload failed", description: "Error saving document.", variant: "destructive" });
    }
  };

  // Handle document deletion
  const handleRemoveDocument = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/delete-document/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete document");

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast({ title: "Document removed", description: "The document has been deleted." });
    } catch (error) {
      console.error("Error removing document:", error);
      toast({ title: "Removal failed", description: "Error deleting document.", variant: "destructive" });
    }
  };

  // Handle influence update
  const handleUpdateDocumentInfluence = async (id: string, influenceScore: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/update-influence/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ influence: influenceScore }),
      });

      if (!response.ok) throw new Error("Failed to update document influence");

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, influenceScore } : doc))
      );

      toast({ title: "Influence updated", description: `Influence set to ${Math.round(influenceScore * 100)}%` });
    } catch (error) {
      console.error("Error updating document influence:", error);
      toast({ title: "Update failed", description: "Error updating influence.", variant: "destructive" });
    }
  };

  return {
    documents,
    setDocuments,
    handleDocumentUpload,
    handleRemoveDocument,
    handleUpdateDocumentInfluence,
  };
};
