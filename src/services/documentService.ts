
import { Document } from "@/types";
import { documentClient } from "@/utils/apiClients";
import { v4 as uuidv4 } from 'uuid';

// Convert database document to application document
export const mapDbDocumentToDocument = (dbDocument: any): Document => {
  return {
    id: dbDocument.id || uuidv4(),
    name: dbDocument.name || dbDocument.filename || "Unnamed Document",
    type: dbDocument.type || (dbDocument.name?.endsWith('.pdf') || dbDocument.filename?.endsWith('.pdf') ? 'pdf' : 'text'),
    content: dbDocument.content || "",
    size: dbDocument.size || undefined,
    influenceScore: dbDocument.influence_score !== undefined ? dbDocument.influence_score : 0.5,
    poisoningLevel: 0, // Default values for new properties
    excluded: false,
  };
};

// Get all documents
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const data = await documentClient.getDocuments();
    
    if (!data || !Array.isArray(data)) {
      console.warn("Unexpected response format from getDocuments:", data);
      return [];
    }
    
    return data.map(mapDbDocumentToDocument);
  } catch (error) {
    console.error("Error in getDocuments service:", error);
    return []; // Return empty array on error so UI doesn't break
  }
};

// Upload a file as a document
export const uploadFile = async (file: File): Promise<Document> => {
  try {
    const data = await documentClient.uploadDocument(file);
    const document = mapDbDocumentToDocument(data);
    console.log("Uploaded document:", document);
    return document;
  } catch (error) {
    console.error("Error uploading file:", error);
    // Create a local document anyway to keep the UI working
    const document: Document = {
      id: uuidv4(),
      name: file.name,
      type: file.name.endsWith('.pdf') ? 'pdf' : 'text',
      content: "Error uploading document",
      size: file.size,
      influenceScore: 0.5,
      poisoningLevel: 0,
      excluded: false
    };
    return document;
  }
};

// Create a text document (without file upload)
export const createTextDocument = async (content: string, name: string): Promise<Document> => {
  // Create a client-side document with default values
  const document: Document = {
    id: uuidv4(),
    name,
    type: 'text',
    content,
    influenceScore: 0.5,
    poisoningLevel: 0,
    excluded: false
  };
  
  console.log("Created text document:", document);
  return document;
};

// Save a document
export const saveDocument = async (document: Document): Promise<Document> => {
  console.log("Saving document:", document);
  // This is just a placeholder - in a real app, you'd send this to the backend
  return { ...document, id: document.id || uuidv4() };
};

// Delete a document
export const deleteDocument = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting document with ID: ${id}`);
    await documentClient.deleteDocument(id);
    console.log(`Successfully deleted document ${id}`);
  } catch (error) {
    console.error(`Error deleting document ${id}:`, error);
    // We still return successfully so the UI can update
  }
};

// Update document influence score
export const updateDocumentInfluence = async (id: string, influenceScore: number): Promise<void> => {
  try {
    console.log(`Updating document ${id} influence to ${influenceScore}`);
    await documentClient.updateDocumentInfluence(id, influenceScore);
  } catch (error) {
    console.error(`Error updating document ${id} influence:`, error);
    // Let the operation succeed anyway for better UI experience
  }
};
