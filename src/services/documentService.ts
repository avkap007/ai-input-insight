
import { supabase } from "@/integrations/supabase/client";
import { Document } from "@/types";
import { DbDocument } from "@/lib/supabase-types";
import { documentClient } from "@/utils/apiClients";

// Convert database document to application document
export const mapDbDocumentToDocument = (dbDocument: DbDocument): Document => {
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

// Convert application document to database document format
export const mapDocumentToDbDocument = (document: Document): Omit<DbDocument, 'id' | 'created_at'> => {
  return {
    name: document.name,
    type: document.type,
    content: document.content,
    size: document.size || null,
    influence_score: document.influenceScore || 0.5,
  };
};

// Get all documents
export const getDocuments = async (): Promise<Document[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
  
  return (data as DbDocument[]).map(mapDbDocumentToDocument);
};

// Save a document
export const saveDocument = async (document: Document): Promise<Document> => {
  // First, save to local Supabase database
  const dbDocument = mapDocumentToDbDocument(document);
  
  const { data, error } = await supabase
    .from('documents')
    .insert([dbDocument])
    .select()
    .single();
  
  if (error) {
    console.error("Error saving document to local database:", error);
    throw error;
  }
  
  // Also upload to the centralized document API
  try {
    // Transform for the API format
    const apiDocument = {
      id: data.id,
      name: document.name,
      content: document.content,
      influence: document.influenceScore || 0.5
    };
    
    // Upload to the document API
    await documentClient.uploadDocuments([apiDocument]);
    console.log("Document also uploaded to centralized API");
  } catch (apiError) {
    console.error("Error uploading to document API (continuing with local save):", apiError);
    // We'll continue even if the API upload fails, since we have the document locally
  }
  
  // Return the document with client-side properties
  return {
    ...mapDbDocumentToDocument(data as DbDocument),
    poisoningLevel: document.poisoningLevel || 0,
    excluded: document.excluded || false
  };
};

// Delete a document
export const deleteDocument = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting document with ID: ${id}`);
    
    // First, delete any related token attributions
    const { error: attributionError, count } = await supabase
      .from('token_attributions')
      .delete()
      .eq('document_id', id);
    
    if (attributionError) {
      console.error("Error deleting related token attributions:", attributionError);
      throw attributionError;
    }
    
    console.log(`Deleted ${count || 0} token attributions for document ${id}`);
    
    // Now delete the document
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
    
    console.log(`Successfully deleted document ${id}`);
  } catch (error) {
    console.error(`Error in deleteDocument function for ID ${id}:`, error);
    throw error;
  }
};

// Update document influence score
export const updateDocumentInfluence = async (id: string, influenceScore: number): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .update({ influence_score: influenceScore })
    .eq('id', id);
  
  if (error) {
    console.error("Error updating document influence:", error);
    throw error;
  }
};
