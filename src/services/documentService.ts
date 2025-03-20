
import { Document } from "@/types";
import { documentClient } from "@/utils/apiClients";

// Convert database document to application document
export const mapDbDocumentToDocument = (dbDocument: any): Document => {
  return {
    id: dbDocument.id,
    name: dbDocument.name,
    type: dbDocument.type,
    content: dbDocument.content,
    size: dbDocument.size || undefined,
    influenceScore: dbDocument.influence_score,
    poisoningLevel: 0, // Default values for new properties
    excluded: false,
  };
};

// Get all documents
export const getDocuments = async (): Promise<Document[]> => {
  const response = await fetch("/api/documents");
  if (!response.ok) {
    throw new Error("Error fetching documents");
  }
  const data = await response.json();
  return data.map(mapDbDocumentToDocument);
};

// Save a document
export const saveDocument = async (document: Document): Promise<Document> => {
  const response = await fetch("/api/upload", {
    method: "POST",
    body: JSON.stringify(document),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Error saving document");
  }

  const data = await response.json();
  
  try {
    // Instead of passing the document directly to uploadDocument, just log it
    // We don't need to call documentClient.uploadDocument here since it's for Files
    console.log("Document saved locally:", data.id);
  } catch (apiError) {
    console.error("Error processing document (continuing with local save):", apiError);
  }

  return { ...mapDbDocumentToDocument(data), poisoningLevel: document.poisoningLevel || 0, excluded: document.excluded || false };
};

// Delete a document
export const deleteDocument = async (id: string): Promise<void> => {
  console.log(`Deleting document with ID: ${id}`);

  const response = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Error deleting document");
  }

  console.log(`Successfully deleted document ${id}`);
};

// Update document influence score
export const updateDocumentInfluence = async (id: string, influenceScore: number): Promise<void> => {
  const response = await fetch(`/api/documents/${id}/influence`, {
    method: "PUT",
    body: JSON.stringify({ influence_score: influenceScore }),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Error updating document influence");
  }
};
