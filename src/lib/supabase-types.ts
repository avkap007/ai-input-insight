
export type DbDocument = {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'quote';
  content: string;
  size: number | null;
  influence_score: number;
  created_at: string;
};

export type DbChatSession = {
  id: string;
  title: string;
  created_at: string;
};

export type DbMessage = {
  id: string;
  chat_session_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type DbAttributionData = {
  id: string;
  message_id: string;
  base_knowledge_percentage: number;
  document_contributions: {
    id: string;
    name: string;
    contribution: number;
  }[];
  created_at: string;
};

export type DbTokenAttribution = {
  id: string;
  message_id: string;
  text: string;
  source: 'base' | 'document';
  document_id: string | null;
  confidence: number;
  created_at: string;
};
