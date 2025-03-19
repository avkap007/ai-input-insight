
import { useState } from 'react';
import { Document } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { saveDocument, deleteDocument, updateDocumentInfluence } from '@/services/documentService';

export const useDocuments = (initialDocuments: Document[] = []) => {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);

  const handleDocumentUpload = async (document: Document) => {
    try {
      // Add advanced properties
      const documentWithAdvancedProps: Document = {
        ...document,
        poisoningLevel: 0,
        excluded: false
      };
      
      const savedDocument = await saveDocument(documentWithAdvancedProps);
      setDocuments(prev => [...prev, savedDocument]);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error saving your document.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast({
        title: "Document removed",
        description: "The document has been removed from your sources.",
      });
    } catch (error) {
      console.error("Error removing document:", error);
      toast({
        title: "Removal failed",
        description: "There was an error removing the document.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDocumentInfluence = async (id: string, influenceScore: number) => {
    try {
      await updateDocumentInfluence(id, influenceScore);
      setDocuments(prev => prev.map(doc => 
        doc.id === id ? { ...doc, influenceScore } : doc
      ));
      toast({
        title: "Influence updated",
        description: `Document influence set to ${Math.round(influenceScore * 100)}%`,
      });
    } catch (error) {
      console.error("Error updating document influence:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating document influence.",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateDocumentPoisoning = (id: string, poisoningLevel: number) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, poisoningLevel } : doc
    ));
    
    toast({
      title: "Data poisoning updated",
      description: `Poisoning level set to ${Math.round(poisoningLevel * 100)}%`,
    });
  };
  
  const handleUpdateDocumentExclusion = (id: string, excluded: boolean) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, excluded } : doc
    ));
    
    toast({
      title: excluded ? "Document excluded" : "Document included",
      description: excluded 
        ? "Document will be excluded from AI response generation" 
        : "Document will be included in AI response generation",
    });
  };

  return {
    documents,
    setDocuments,
    handleDocumentUpload,
    handleRemoveDocument,
    handleUpdateDocumentInfluence,
    handleUpdateDocumentPoisoning,
    handleUpdateDocumentExclusion
  };
};
