
import { supabase } from "@/integrations/supabase/client";
import { Message, AttributionData, TokenAttribution } from "@/types";
import { DbMessage, DbChatSession, DbAttributionData, DbTokenAttribution } from "@/lib/supabase-types";

// Create a new chat session
export const createChatSession = async (title?: string): Promise<string> => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([{ title: title || 'New Chat' }])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating chat session:", error);
    throw error;
  }
  
  return (data as DbChatSession).id;
};

// Convert database message to application message
export const mapDbMessageToMessage = (dbMessage: DbMessage): Message => {
  return {
    id: dbMessage.id,
    role: dbMessage.role,
    content: dbMessage.content,
    timestamp: new Date(dbMessage.timestamp),
  };
};

// Get all messages for a chat session
export const getMessages = async (chatSessionId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_session_id', chatSessionId)
    .order('timestamp', { ascending: true });
  
  if (error) {
    console.error(`Error fetching messages for chat session ${chatSessionId}:`, error);
    throw error;
  }
  
  return (data as DbMessage[]).map(mapDbMessageToMessage);
};

// Save a message
export const saveMessage = async (
  chatSessionId: string,
  message: Omit<Message, 'id'>
): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      chat_session_id: chatSessionId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
    }])
    .select()
    .single();
  
  if (error) {
    console.error("Error saving message:", error);
    throw error;
  }
  
  return mapDbMessageToMessage(data as DbMessage);
};

// Save token attributions for a message
export const saveTokenAttributions = async (
  messageId: string,
  attributions: TokenAttribution[]
): Promise<void> => {
  try {
    if (!attributions || attributions.length === 0) {
      console.log(`No attributions to save for message ${messageId}`);
      return;
    }
    
    console.log(`Saving ${attributions.length} token attributions for message ${messageId}`);
    
    const dbAttributions = attributions.map(attribution => ({
      message_id: messageId,
      text: attribution.text,
      source: attribution.source,
      document_id: attribution.documentId || null,
      confidence: attribution.confidence,
    }));
    
    const { error } = await supabase
      .from('token_attributions')
      .insert(dbAttributions);
    
    if (error) {
      console.error("Error saving token attributions:", error);
      throw error;
    }
    
    console.log(`Successfully saved attributions for message ${messageId}`);
  } catch (error) {
    console.error(`Error in saveTokenAttributions for message ${messageId}:`, error);
    throw error;
  }
};

// Save attribution data for a message
export const saveAttributionData = async (
  messageId: string,
  attributionData: AttributionData
): Promise<void> => {
  try {
    console.log(`Saving attribution data for message ${messageId}:`, attributionData);
    
    const { error } = await supabase
      .from('attribution_data')
      .insert([{
        message_id: messageId,
        base_knowledge_percentage: attributionData.baseKnowledge,
        document_contributions: attributionData.documents,
      }]);
    
    if (error) {
      console.error("Error saving attribution data:", error);
      throw error;
    }
    
    console.log(`Successfully saved attribution data for message ${messageId}`);
  } catch (error) {
    console.error(`Error in saveAttributionData for message ${messageId}:`, error);
    throw error;
  }
};

// Get token attributions for a message
export const getTokenAttributions = async (messageId: string): Promise<TokenAttribution[]> => {
  const { data, error } = await supabase
    .from('token_attributions')
    .select('*')
    .eq('message_id', messageId);
  
  if (error) {
    console.error(`Error fetching token attributions for message ${messageId}:`, error);
    throw error;
  }
  
  return (data as DbTokenAttribution[]).map(dbAttribution => ({
    text: dbAttribution.text,
    source: dbAttribution.source,
    documentId: dbAttribution.document_id || undefined,
    confidence: dbAttribution.confidence,
  }));
};

// Get attribution data for a message
export const getAttributionData = async (messageId: string): Promise<AttributionData | null> => {
  const { data, error } = await supabase
    .from('attribution_data')
    .select('*')
    .eq('message_id', messageId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No data found
      return null;
    }
    console.error(`Error fetching attribution data for message ${messageId}:`, error);
    throw error;
  }
  
  const dbAttributionData = data as DbAttributionData;
  return {
    baseKnowledge: dbAttributionData.base_knowledge_percentage,
    documents: dbAttributionData.document_contributions,
  };
};
