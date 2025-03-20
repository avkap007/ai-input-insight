
import { serve } from "https://deno.land/std@0.199.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get environment variables
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

// Log setup information for debugging
console.log("Anthropic API Key Loaded:", ANTHROPIC_API_KEY ? "Yes" : "No");
if (!ANTHROPIC_API_KEY) {
  console.error("Error: Anthropic API key is missing. Check Supabase secrets.");
}

// Main request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, documents } = await req.json();
    
    console.log(`Received query: "${query}" with ${documents.length} documents`);

    // Always try to use the Anthropic API
    try {
      console.log("Using Anthropic API for response generation");
      const response = await generateAnthropicResponse(query, documents);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (anthropicError) {
      console.error("Error with Anthropic API:", anthropicError);
      console.log("Falling back to mock response");
      const response = await generateMockResponse(query, documents);
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

/**
 * Calls Anthropic API with documents and query
 */
async function generateAnthropicResponse(query: string, documents: any[]): Promise<any> {
  // Sort documents by influence weight
  documents.sort((a, b) => (b.influence || 0) - (a.influence || 0));

  console.log(`Making Anthropic API call with ${documents.length} active documents`);
  
  // Create a system prompt that explains what we want
  const systemPrompt = `You are an AI assistant that provides responses influenced by provided documents. 
Your answers should reflect the knowledge, style, and tone from the documents based on their influence scores.
Follow these important guidelines:
1. Explicitly incorporate content from the documents in your response
2. Prioritize documents with higher influence scores
3. Create a detailed and well-structured response to the query
4. Add your own knowledge when appropriate, but give priority to document content`;

  // Create a structured user prompt with documents
  let userPrompt = `The user asked: "${query}"\n\n`;
  userPrompt += `Please provide a response based on these documents (with their influence scores):\n\n`;

  // Include document content with influence scores
  for (const doc of documents) {
    const influencePercent = Math.round((doc.influence || 0.5) * 100);
    userPrompt += `\n--- DOCUMENT: "${doc.name}" (Influence: ${influencePercent}%) ---\n`;
    userPrompt += `${doc.content.slice(0, 1000)}\n`;
    
    if (doc.content.length > 1000) {
        userPrompt += `[Content truncated - original length: ${doc.content.length} characters]\n`;
    }
  }

  try {
    console.log("Sending request to Anthropic API");
    
    // Make the request to Anthropic API using fetch
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Successfully received response from Anthropic API");
    
    // Extract the generated content
    const generatedText = result.content[0].text;
    console.log("Generated content length:", generatedText.length);
    
    // Calculate document contributions for attribution
    const sourceAttribution: Record<string, number> = {};
    documents.forEach(doc => {
      sourceAttribution[doc.id] = Math.round(((doc.influence || 0.5) * 100));
    });
    
    return {
      generated_text: generatedText,
      source_attribution: sourceAttribution
    };
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    throw error;
  }
}

/**
 * Mock response generator (if Claude API fails or is unavailable).
 */
async function generateMockResponse(query: string, documents: any[]): Promise<any> {
  console.log("Generating mock response");
  
  // Generate a simple response
  let mockContent = `Here's a response to your query: "${query}"\n\n`;
  
  if (documents.length === 0) {
    mockContent += "I don't have any documents to reference. Please upload some documents so I can provide insights based on them.";
    
    return {
      generated_text: mockContent,
      source_attribution: {}
    };
  }
  
  // Create a simple response using snippets from documents
  mockContent += "Based on the documents you've provided, I can tell you that:\n\n";
  
  // Sort documents by influence score
  documents.sort((a, b) => (b.influence || 0.5) - (a.influence || 0.5));
  
  // Add snippets from each document based on influence
  const sourceAttribution: Record<string, number> = {};
  
  for (const doc of documents) {
    const influencePercent = Math.round((doc.influence || 0.5) * 100);
    sourceAttribution[doc.id] = influencePercent;
    
    if (influencePercent > 10) {
      // Extract a snippet from the document
      const snippet = doc.content.split(/\.\s+/).slice(0, 2).join('. ') + '.';
      mockContent += `From ${doc.name}: "${snippet}"\n\n`;
    }
  }
  
  mockContent += "This is a mock response since the AI service is currently unavailable.";
  
  return {
    generated_text: mockContent,
    source_attribution: sourceAttribution
  };
}
