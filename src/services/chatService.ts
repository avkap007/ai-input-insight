import { Message, AttributionData, TokenAttribution } from "@/types";

// Create a new chat session
export const createChatSession = async (title?: string): Promise<string> => {
  const response = await fetch("/api/chat/sessions", {
    method: "POST",
    body: JSON.stringify({ title: title || "New Chat" }),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Error creating chat session");
  }

  const data = await response.json();
  return data.id;
};

// Get all messages for a chat session
export const getMessages = async (chatSessionId: string): Promise<Message[]> => {
  const response = await fetch(`/api/chat/messages?chatSessionId=${chatSessionId}`);
  if (!response.ok) {
    throw new Error("Error fetching messages");
  }
  return await response.json();
};

// Save a message
export const saveMessage = async (chatSessionId: string, message: Omit<Message, "id">): Promise<Message> => {
  const response = await fetch("/api/chat/messages", {
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

  const response = await fetch("/api/chat/token-attributions", {
    method: "POST",
    body: JSON.stringify({ messageId, attributions }),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Error saving token attributions");
  }
};

// Save attribution data for a message
export const saveAttributionData = async (messageId: string, attributionData: AttributionData): Promise<void> => {
  console.log(`Saving attribution data for message ${messageId}:`, attributionData);

  const response = await fetch("/api/chat/attribution-data", {
    method: "POST",
    body: JSON.stringify({ messageId, attributionData }),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Error saving attribution data");
  }
};

// Get token attributions for a message
export const getTokenAttributions = async (messageId: string): Promise<TokenAttribution[]> => {
  const response = await fetch(`/api/chat/token-attributions?messageId=${messageId}`);
  if (!response.ok) {
    throw new Error("Error fetching token attributions");
  }
  return await response.json();
};

// Get attribution data for a message
export const getAttributionData = async (messageId: string): Promise<AttributionData | null> => {
  const response = await fetch(`/api/chat/attribution-data?messageId=${messageId}`);
  if (!response.ok) {
    return null;
  }
  return await response.json();
};
