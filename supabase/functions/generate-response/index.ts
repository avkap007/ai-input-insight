
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Document = {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'quote';
  content: string;
  size?: number;
  influenceScore?: number;
};

type TokenAttribution = {
  text: string;
  source: 'base' | 'document';
  documentId?: string;
  confidence: number;
};

type AttributionData = {
  baseKnowledge: number;
  documents: {
    id: string;
    name: string;
    contribution: number;
  }[];
};

type ResponsePayload = {
  content: string;
  attributions: TokenAttribution[];
  attributionData: AttributionData;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { query, documents } = await req.json();
    
    // Create a response based on the query and documents
    const response = generateMockResponse(query, documents);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-response function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateMockResponse(query: string, documents: Document[]): ResponsePayload {
  // If no documents are provided, return a simple response
  if (documents.length === 0) {
    return {
      content: "I don't have any documents to reference. Please upload some documents so I can provide insights based on them.",
      attributions: [{
        text: "I don't have any documents to reference. Please upload some documents so I can provide insights based on them.",
        source: 'base',
        confidence: 1.0
      }],
      attributionData: {
        baseKnowledge: 100,
        documents: []
      }
    };
  }
  
  // Extract content from documents to create a response
  let content = `Based on the documents you've provided, I can tell you that `;
  
  // Add snippets from documents
  documents.forEach((doc, index) => {
    const snippet = doc.content.substring(0, Math.min(100, doc.content.length)).trim();
    content += snippet;
    if (index < documents.length - 1) {
      content += ". Furthermore, ";
    }
  });
  
  content += "\n\nThis response is influenced by both your uploaded documents and my base knowledge.";
  
  // Create mock token attributions
  const attributions: TokenAttribution[] = [];
  
  // Add "Based on the documents you've provided, I can tell you that" as base knowledge
  attributions.push({
    text: "Based on the documents you've provided, I can tell you that ",
    source: 'base',
    confidence: 0.9
  });
  
  // Add document snippets with attributions
  documents.forEach((doc, index) => {
    const snippet = doc.content.substring(0, Math.min(100, doc.content.length)).trim();
    attributions.push({
      text: snippet,
      source: 'document',
      documentId: doc.id,
      confidence: 0.85
    });
    
    if (index < documents.length - 1) {
      attributions.push({
        text: ". Furthermore, ",
        source: 'base',
        confidence: 0.9
      });
    }
  });
  
  // Add final sentence as base knowledge
  attributions.push({
    text: "\n\nThis response is influenced by both your uploaded documents and my base knowledge.",
    source: 'base',
    confidence: 0.95
  });
  
  // Create mock attribution data
  const totalDocs = documents.length;
  const basePercentage = 65;
  const docContribution = (100 - basePercentage) / totalDocs;
  
  const attributionData: AttributionData = {
    baseKnowledge: basePercentage,
    documents: documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      contribution: docContribution
    }))
  };
  
  return {
    content,
    attributions,
    attributionData
  };
}
