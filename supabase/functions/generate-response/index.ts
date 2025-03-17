
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
  
  // Calculate the total influence scores
  const totalInfluence = documents.reduce((sum, doc) => sum + (doc.influenceScore || 0.5), 0);
  
  // Normalize influence scores
  const normalizedDocuments = documents.map(doc => ({
    ...doc,
    normalizedInfluence: totalInfluence > 0 
      ? (doc.influenceScore || 0.5) / totalInfluence 
      : 1 / documents.length
  }));
  
  // Sort documents by normalized influence (highest first)
  normalizedDocuments.sort((a, b) => b.normalizedInfluence - a.normalizedInfluence);
  
  // Generate response content weighted by document influence
  let content = `Based on the documents you've provided, with their varying levels of influence, I can tell you that `;
  
  // Add snippets from documents, weighted by influence
  normalizedDocuments.forEach((doc, index) => {
    // Length of snippet is proportional to document influence
    const snippetLength = Math.max(30, Math.round(doc.normalizedInfluence * 200));
    const snippet = doc.content.substring(0, Math.min(snippetLength, doc.content.length)).trim();
    content += snippet;
    if (index < normalizedDocuments.length - 1) {
      content += ". Furthermore, ";
    }
  });
  
  content += "\n\nThis response is influenced by your uploaded documents based on the influence levels you've set.";
  
  // Create token attributions
  const attributions: TokenAttribution[] = [];
  
  // Add initial text as base knowledge
  attributions.push({
    text: "Based on the documents you've provided, with their varying levels of influence, I can tell you that ",
    source: 'base',
    confidence: 0.9
  });
  
  // Add document snippets with attributions, weighted by influence
  normalizedDocuments.forEach((doc, index) => {
    const snippetLength = Math.max(30, Math.round(doc.normalizedInfluence * 200));
    const snippet = doc.content.substring(0, Math.min(snippetLength, doc.content.length)).trim();
    attributions.push({
      text: snippet,
      source: 'document',
      documentId: doc.id,
      confidence: 0.7 + (doc.normalizedInfluence * 0.3) // Higher influence = higher confidence
    });
    
    if (index < normalizedDocuments.length - 1) {
      attributions.push({
        text: ". Furthermore, ",
        source: 'base',
        confidence: 0.9
      });
    }
  });
  
  // Add final sentence as base knowledge
  attributions.push({
    text: "\n\nThis response is influenced by your uploaded documents based on the influence levels you've set.",
    source: 'base',
    confidence: 0.95
  });
  
  // Base knowledge percentage (inverse of total normalized influence)
  const basePercentage = 40; // Fixed base percentage
  
  // Create attribution data with document contributions based on influence
  const attributionData: AttributionData = {
    baseKnowledge: basePercentage,
    documents: normalizedDocuments.map(doc => ({
      id: doc.id,
      name: doc.name,
      contribution: Math.round((100 - basePercentage) * doc.normalizedInfluence)
    }))
  };
  
  return {
    content,
    attributions,
    attributionData
  };
}
