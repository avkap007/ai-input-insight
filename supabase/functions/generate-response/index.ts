
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
    // Return a fallback response to avoid breaking the client
    const fallbackResponse = {
      generated_text: "I apologize, but I'm having trouble processing your request right now. Please try again.",
      source_attribution: {},
      attributions: [],
      attributionData: {
        baseKnowledge: 100,
        documents: []
      }
    };
    
    return new Response(JSON.stringify(fallbackResponse), {
      status: 200, // Still return 200 to allow client to handle the response
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
  const documentContributions = [];
  
  for (const doc of documents) {
    const influencePercent = Math.round((doc.influence || 0.5) * 100);
    userPrompt += `\n--- DOCUMENT: "${doc.name}" (Influence: ${influencePercent}%) ---\n`;
    userPrompt += `${doc.content.slice(0, 1000)}\n`;
    
    if (doc.content.length > 1000) {
        userPrompt += `[Content truncated - original length: ${doc.content.length} characters]\n`;
    }
    
    // Add this document to the contributions list
    documentContributions.push({
      id: doc.id,
      name: doc.name,
      contribution: influencePercent
    });
  }

  try {
    console.log("Sending request to Anthropic API");
    
    if (!ANTHROPIC_API_KEY) {
      throw new Error("Anthropic API key not configured");
    }
    
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
    
    // Create attributionData for the response
    const attributionData = {
      baseKnowledge: 20, // Assume 20% comes from base knowledge
      documents: documentContributions
    };
    
    // For now, return a simple mock of attributions (would be more sophisticated in production)
    const attributions = generateSimpleAttributions(generatedText, documents);
    
    return {
      generated_text: generatedText,
      source_attribution: sourceAttribution,
      attributions: attributions,
      attributionData: attributionData
    };
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    throw error;
  }
}

/**
 * Generate simple attributions based on text matching
 */
function generateSimpleAttributions(text: string, documents: any[]): any[] {
  const attributions = [];
  const words = text.split(/\s+/);
  
  // Just a simple mock attribution generator
  for (let i = 0; i < words.length; i++) {
    // Randomly attribute every 10th word to a document
    if (i % 10 === 0 && documents.length > 0) {
      const randomDoc = documents[Math.floor(Math.random() * documents.length)];
      attributions.push({
        text: words[i],
        source: 'document',
        documentId: randomDoc.id,
        confidence: 0.8
      });
    } else if (i % 15 === 0) {
      // And some to base knowledge
      attributions.push({
        text: words[i],
        source: 'base',
        confidence: 0.9
      });
    }
  }
  
  return attributions;
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
      source_attribution: {},
      attributions: [],
      attributionData: {
        baseKnowledge: 100,
        documents: []
      }
    };
  }
  
  // Create a simple response using snippets from documents
  mockContent += "Based on the documents you've provided, I can tell you that:\n\n";
  
  // Sort documents by influence score
  documents.sort((a, b) => (b.influence || 0.5) - (a.influence || 0.5));
  
  // Add snippets from each document based on influence
  const sourceAttribution: Record<string, number> = {};
  const documentContributions = [];
  
  for (const doc of documents) {
    const influencePercent = Math.round((doc.influence || 0.5) * 100);
    sourceAttribution[doc.id] = influencePercent;
    
    documentContributions.push({
      id: doc.id,
      name: doc.name,
      contribution: influencePercent
    });
    
    if (influencePercent > 10) {
      // Extract a snippet from the document
      const snippet = doc.content.split(/\.\s+/).slice(0, 2).join('. ') + '.';
      mockContent += `From ${doc.name}: "${snippet}"\n\n`;
    }
  }
  
  mockContent += "This is a mock response since the AI service is currently unavailable.";
  
  // Generate simple attributions for the mock response
  const attributions = generateSimpleAttributions(mockContent, documents);
  
  return {
    generated_text: mockContent,
    source_attribution: sourceAttribution,
    attributions: attributions,
    attributionData: {
      baseKnowledge: 30,
      documents: documentContributions
    }
  };
}
