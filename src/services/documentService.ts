
import { Document } from "@/types";
import { documentClient } from "@/utils/apiClients";

// Convert database document to application document
export const mapDbDocumentToDocument = (dbDocument: any): Document => {
  return {
    id: dbDocument.id,
    name: dbDocument.name,
    type: dbDocument.type || (dbDocument.name.endsWith('.pdf') ? 'pdf' : 'text'),
    content: dbDocument.content,
    size: dbDocument.size || undefined,
    influenceScore: dbDocument.influence_score,
    poisoningLevel: 0, // Default values for new properties
    excluded: false,
  };
};

// Get all documents
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const data = await documentClient.getDocuments();
    return data.map(mapDbDocumentToDocument);
  } catch (error) {
    console.error("Error in getDocuments service:", error);
    throw error;
  }
};

// Upload a file as a document
export const uploadFile = async (file: File): Promise<Document> => {
  try {
    const data = await documentClient.uploadDocument(file);
    return mapDbDocumentToDocument(data);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Save a document
export const saveDocument = async (document: Document): Promise<Document> => {
  console.log("Saving document:", document);
  // This is just a placeholder - in a real app, you'd send this to the backend
  return { ...document, id: document.id || crypto.randomUUID() };
};

// Delete a document
export const deleteDocument = async (id: string): Promise<void> => {
  console.log(`Deleting document with ID: ${id}`);
  await documentClient.deleteDocument(id);
  console.log(`Successfully deleted document ${id}`);
};

// Update document influence score
export const updateDocumentInfluence = async (id: string, influenceScore: number): Promise<void> => {
  await documentClient.updateDocumentInfluence(id, influenceScore);
};
