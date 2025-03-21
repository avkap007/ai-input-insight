
import { Message, AttributionData, TokenAttribution } from "@/types";

// Create a new chat session
export const createChatSession = async (title?: string): Promise<string> => {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ title: title || "New Chat" }),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Error creating chat session");
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Chat session creation error:", error);
    throw error;
  }
};

// Get all messages for a chat session
export const getMessages = async (chatSessionId: string): Promise<Message[]> => {
  const response = await fetch(`http://127.0.0.1:8000/api/chat/messages?chatSessionId=${chatSessionId}`);
  if (!response.ok) {
    throw new Error("Error fetching messages");
  }
  return await response.json();
};

// Save a message
export const saveMessage = async (chatSessionId: string, message: Omit<Message, "id">): Promise<Message> => {
  const response = await fetch("http://127.0.0.1:8000/api/chat/messages", {
    method: "POST",
    body: JSON.stringify({
      chatSessionId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
    }),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Error saving message");
  }

  return await response.json();
};

// Save token attributions for a message
export const saveTokenAttributions = async (messageId: string, attributions: TokenAttribution[]): Promise<void> => {
  if (!attributions || attributions.length === 0) {
    console.log(`No attributions to save for message ${messageId}`);
    return;
  }

  console.log(`Saving ${attributions.length} token attributions for message ${messageId}`);

  // Currently not implemented in the backend, just log for now
  console.log("Token attributions:", attributions);
};

// Save attribution data for a message
export const saveAttributionData = async (messageId: string, attributionData: AttributionData): Promise<void> => {
  console.log(`Saving attribution data for message ${messageId}:`, attributionData);
  
  // Currently not implemented in the backend, just log for now
  console.log("Attribution data:", attributionData);
};

// Get token attributions for a message
export const getTokenAttributions = async (messageId: string): Promise<TokenAttribution[]> => {
  // Mock implementation for now
  console.log(`Getting token attributions for message ${messageId}`);
  return [];
};

// Get attribution data for a message
export const getAttributionData = async (messageId: string): Promise<AttributionData | null> => {
  // Mock implementation for now
  console.log(`Getting attribution data for message ${messageId}`);
  return null;
};
