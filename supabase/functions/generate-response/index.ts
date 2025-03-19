import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  poisoningLevel?: number;
  excluded?: boolean;
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

// Get the Anthropic API key from environment variable
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { query, documents } = await req.json();
    
    // Check if Anthropic API key is provided
    if (!ANTHROPIC_API_KEY) {
      console.log("Anthropic API key not found, using mock response");
      const response = generateMockResponse(query, documents);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Use Anthropic API
    try {
      console.log("Using Anthropic API for response generation");
      const response = await generateAnthropicResponse(query, documents);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (anthropicError) {
      console.error("Error with Anthropic API:", anthropicError);
      // Fallback to mock response if Anthropic fails
      const response = generateMockResponse(query, documents);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in generate-response function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateAnthropicResponse(query: string, documents: Document[]): Promise<ResponsePayload> {
  // Filter out excluded documents
  const activeDocuments = documents.filter(doc => !doc.excluded);
  
  // If no documents are provided, return a simple response
  if (activeDocuments.length === 0) {
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
  const totalInfluence = activeDocuments.reduce((sum, doc) => sum + (doc.influenceScore || 0.5), 0);
  
  // Prepare document context
  const documentContext = activeDocuments.map(doc => {
    const influenceWeight = totalInfluence > 0 
      ? (doc.influenceScore || 0.5) / totalInfluence 
      : 1 / activeDocuments.length;
      
    // Apply data poisoning effect if present
    let content = doc.content;
    if (doc.poisoningLevel && doc.poisoningLevel > 0) {
      // Add a note about the poisoning level to help track its effects
      content = `[Note: This document has a simulated poisoning level of ${doc.poisoningLevel}] ${content}`;
    }
    
    return {
      id: doc.id,
      name: doc.name,
      content,
      influenceWeight
    };
  });
  
  // Sort by influence weight (highest first)
  documentContext.sort((a, b) => b.influenceWeight - a.influenceWeight);
  
  // Build the system prompt
  let systemPrompt = "You are an AI assistant that answers questions based on the provided documents. ";
  systemPrompt += "For each response, you must consider the influence weight of each document. ";
  systemPrompt += "Documents with higher influence weights should have more impact on your response. ";
  
  // Add document context to system prompt
  documentContext.forEach((doc, index) => {
    systemPrompt += `\n\nDocument ${index + 1} (${doc.name}, Influence: ${(doc.influenceWeight * 100).toFixed(1)}%): ${doc.content}`;
  });
  
  // Call the Anthropic API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  const generatedContent = result.content[0].text;
  
  // Calculate attribution data based on document influence weights
  const basePercentage = 40; // Fixed base percentage
  
  const attributionData: AttributionData = {
    baseKnowledge: basePercentage,
    documents: documentContext.map(doc => ({
      id: doc.id,
      name: doc.name,
      contribution: Math.round((100 - basePercentage) * doc.influenceWeight)
    }))
  };
  
  // Create simplified token attributions
  // In a real implementation, this would be more sophisticated
  const attributions: TokenAttribution[] = [
    {
      text: generatedContent,
      source: 'base',
      confidence: 0.9
    }
  ];
  
  // Add document attributions if there are documents
  if (activeDocuments.length > 0) {
    documentContext.forEach(doc => {
      attributions.push({
        text: doc.content.substring(0, Math.min(30, doc.content.length)),
        source: 'document',
        documentId: doc.id,
        confidence: 0.7 + (doc.influenceWeight * 0.3)
      });
    });
  }
  
  return {
    content: generatedContent,
    attributions,
    attributionData
  };
}

function generateMockResponse(query: string, documents: Document[]): Promise<ResponsePayload> {
  // Filter out excluded documents
  const activeDocuments = documents.filter(doc => !doc.excluded);
  
  // If no documents are provided, return a simple response
  if (activeDocuments.length === 0) {
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
  const totalInfluence = activeDocuments.reduce((sum, doc) => sum + (doc.influenceScore || 0.5), 0);
  
  // Normalize influence scores
  const normalizedDocuments = activeDocuments.map(doc => ({
    ...doc,
    normalizedInfluence: totalInfluence > 0 
      ? (doc.influenceScore || 0.5) / totalInfluence 
      : 1 / activeDocuments.length
  }));
  
  // Sort documents by normalized influence (highest first)
  normalizedDocuments.sort((a, b) => b.normalizedInfluence - a.normalizedInfluence);
  
  // Generate response content weighted by document influence
  let content = `Based on the documents you've provided, with their varying levels of influence, I can tell you that `;
  
  // Add snippets from documents, weighted by influence
  normalizedDocuments.forEach((doc, index) => {
    // Length of snippet is proportional to document influence
    const snippetLength = Math.max(30, Math.round(doc.normalizedInfluence * 200));
    
    // Get a snippet from the content
    let snippet = doc.content.substring(0, Math.min(snippetLength, doc.content.length)).trim();
    
    // Add the snippet
    content += snippet;
    
    if (index < normalizedDocuments.length - 1) {
      content += ". Furthermore, ";
    }
  });
  
  content += "\n\nThis response is influenced by your uploaded documents based on the influence levels you've set.";
  
  // Add information about data poisoning if any documents are poisoned
  const poisonedDocs = normalizedDocuments.filter(doc => doc.poisoningLevel && doc.poisoningLevel > 0);
  if (poisonedDocs.length > 0) {
    content += "\n\nNote: Some of the source documents have simulated data poisoning applied, which may affect the reliability of this response.";
  }
  
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
    
    // Calculate confidence based on influence and poisoning
    let confidence = 0.7 + (doc.normalizedInfluence * 0.3); // Higher influence = higher confidence
    
    // Reduce confidence if the document is poisoned
    if (doc.poisoningLevel && doc.poisoningLevel > 0) {
      confidence = confidence * (1 - doc.poisoningLevel * 0.5);
    }
    
    attributions.push({
      text: snippet,
      source: 'document',
      documentId: doc.id,
      confidence
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
  
  // Add poisoning warning if applicable
  if (poisonedDocs.length > 0) {
    attributions.push({
      text: "\n\nNote: Some of the source documents have simulated data poisoning applied, which may affect the reliability of this response.",
      source: 'base',
      confidence: 0.99
    });
  }
  
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
