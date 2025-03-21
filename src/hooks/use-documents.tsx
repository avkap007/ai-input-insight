
import { useState, useEffect } from "react";
import { Document } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { documentClient } from "@/utils/apiClients";
import { v4 as uuidv4 } from "uuid";

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch documents from API on load
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await documentClient.getDocuments();
        console.log("Fetched documents from API:", response);
        
        // Map the API response to our Document type
        const mappedDocuments = response.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          type: doc.name.endsWith('.pdf') ? 'pdf' : 'text',
          content: doc.content,
          size: doc.size || undefined,
          influenceScore: doc.influence_score || 0.5,
          poisoningLevel: 0,
          excluded: false
        }));
        
        console.log("Mapped documents:", mappedDocuments);

        setDocuments(mappedDocuments);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast({ title: "Error", description: "Failed to load documents.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);

  // Handle document upload
  const handleDocumentUpload = async (file: File) => {
    try {
      const uploadedDoc = await documentClient.uploadDocument(file);
      
      // Map the API response to our Document type
      const newDocument: Document = {
        id: uploadedDoc.id || uuidv4(),
        name: uploadedDoc.filename,
        type: uploadedDoc.filename.endsWith('.pdf') ? 'pdf' : 'text',
        content: uploadedDoc.content,
        size: file.size,
        influenceScore: 0.5, // Default influence
        poisoningLevel: 0,
        excluded: false
      };
      
      setDocuments((prev) => [...prev, newDocument]);
      toast({ title: "Document uploaded", description: "Your document has been added successfully." });
      
      return newDocument;
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({ title: "Upload failed", description: "Error saving document.", variant: "destructive" });
      throw error;
    }
  };
  
  // Handle document direct text addition
  const handleAddTextDocument = async (textContent: string, name?: string) => {
    try {
      // For text snippets, we create a file object and upload it
      const blob = new Blob([textContent], { type: 'text/plain' });
      const file = new File([blob], name || `Quote_${new Date().toISOString()}.txt`, { type: 'text/plain' });
      
      return await handleDocumentUpload(file);
    } catch (error) {
      console.error("Error adding text document:", error);
      toast({ title: "Addition failed", description: "Error saving text.", variant: "destructive" });
      throw error;
    }
  };

  // Handle document deletion
  const handleRemoveDocument = async (id: string) => {
    try {
      await documentClient.deleteDocument(id);
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
      await documentClient.updateDocumentInfluence(id, influenceScore);
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, influenceScore } : doc))
      );
      toast({ title: "Influence updated", description: `Influence set to ${Math.round(influenceScore * 100)}%` });
    } catch (error) {
      console.error("Error updating document influence:", error);
      toast({ title: "Update failed", description: "Error updating influence.", variant: "destructive" });
    }
  };
  
  // Update poisoning level (client-side only)
  const handleUpdateDocumentPoisoning = (id: string, poisoningLevel: number) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, poisoningLevel } : doc))
    );
  };
  
  // Update exclusion status (client-side only)
  const handleUpdateDocumentExclusion = (id: string, excluded: boolean) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, excluded } : doc))
    );
  };

  return {
    documents,
    isLoading,
    handleDocumentUpload,
    handleAddTextDocument,
    handleRemoveDocument,
    handleUpdateDocumentInfluence,
    handleUpdateDocumentPoisoning,
    handleUpdateDocumentExclusion
  };
};
