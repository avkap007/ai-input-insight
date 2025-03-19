
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attributions?: TokenAttribution[];
  attributionData?: AttributionData;
  analysisData?: AnalysisData;
};

export type Document = {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'quote';
  content: string;
  size?: number;
  influenceScore?: number;
  poisoningLevel?: number;
  excluded?: boolean;
};

export type TokenAttribution = {
  text: string;
  source: 'base' | 'document';
  documentId?: string;
  confidence: number;
};

export type AttributionData = {
  baseKnowledge: number;
  documents: {
    id: string;
    name: string;
    contribution: number;
  }[];
};

export type AnalysisData = {
  sentiment: number;
  bias: Record<string, number>;
  trustScore: number;
};
