
import { useState, useCallback } from "react";
import { Document } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { documentClient } from "@/utils/apiClients";
import { v4 as uuidv4 } from "uuid";

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle file upload - extract text via API, store locally
  const handleDocumentUpload = async (file: File) => {
    try {
      // Call API to extract text from file
      const result = await documentClient.extractText(file);
      
      // Create document object
      const newDocument: Document = {
        id: result.id || uuidv4(),
        name: result.filename || file.name,
        type: file.name.endsWith('.pdf') ? 'pdf' : 'text',
        content: result.content,
        size: file.size,
        influenceScore: result.influence_score || 0.5,
        poisoningLevel: 0,
        excluded: false
      };
      
      setDocuments((prev) => [...prev, newDocument]);
      toast({ title: "Document uploaded", description: "Your document has been added successfully." });
      
      return newDocument;
    } catch (error) {
      console.error("Error uploading document:", error);
      
      // Fallback: try to read text file locally
      if (!file.name.endsWith('.pdf')) {
        try {
          const content = await file.text();
          const newDocument: Document = {
            id: uuidv4(),
            name: file.name,
            type: 'text',
            content,
            size: file.size,
            influenceScore: 0.5,
            poisoningLevel: 0,
            excluded: false
          };
          setDocuments((prev) => [...prev, newDocument]);
          toast({ title: "Document uploaded", description: "Your document has been added (local processing)." });
          return newDocument;
        } catch (e) {
          console.error("Local fallback failed:", e);
        }
      }
      
      toast({ title: "Upload failed", description: "Error processing document.", variant: "destructive" });
      throw error;
    }
  };
  
  // Handle direct text addition
  const handleAddTextDocument = async (textContent: string, name?: string) => {
    const newDocument: Document = {
      id: uuidv4(),
      name: name || `Text_${new Date().toISOString().slice(0, 10)}.txt`,
      type: 'text',
      content: textContent,
      influenceScore: 0.5,
      poisoningLevel: 0,
      excluded: false
    };
    
    setDocuments((prev) => [...prev, newDocument]);
    toast({ title: "Text added", description: "Your text has been added as a document." });
    
    return newDocument;
  };

  // Remove document (local only)
  const handleRemoveDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    toast({ title: "Document removed", description: "The document has been deleted." });
  };

  // Update influence (local only)
  const handleUpdateDocumentInfluence = async (id: string, influenceScore: number) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, influenceScore } : doc))
    );
  };
  
  // Update poisoning level (local only)
  const handleUpdateDocumentPoisoning = (id: string, poisoningLevel: number) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, poisoningLevel } : doc))
    );
  };
  
  // Update exclusion status (local only)
  const handleUpdateDocumentExclusion = (id: string, excluded: boolean) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, excluded } : doc))
    );
  };

  // Clear all documents
  const handleClearDocuments = () => {
    setDocuments([]);
    toast({ title: "Documents cleared", description: "All documents have been removed." });
  };

  return {
    documents,
    isLoading,
    handleDocumentUpload,
    handleAddTextDocument,
    handleRemoveDocument,
    handleUpdateDocumentInfluence,
    handleUpdateDocumentPoisoning,
    handleUpdateDocumentExclusion,
    handleClearDocuments
  };
};
