import { serve } from "https://deno.land/std@0.199.0/http/server.ts";

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

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

console.log("Anthropic API Key Loaded:", ANTHROPIC_API_KEY ? "Yes" : "No");
if (!ANTHROPIC_API_KEY) {
  console.error("Error: Anthropic API key is missing. Check Supabase secrets.");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, documents } = await req.json();

    if (!ANTHROPIC_API_KEY) {
      console.log("Anthropic API key not found, using mock response");
      const response = await generateMockResponse(query, documents);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      console.log("Using Anthropic API for response generation");
      const response = await generateAnthropicResponse(query, documents);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (anthropicError) {
      console.error("Error with Anthropic API:", anthropicError);
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
 * Builds a structured response using document influence before sending to Claude.
 */
function buildDraftResponse(query: string, documents: Document[]): string {
    let response = `The user asked: "${query}". Below is a structured response considering document influence.\n\n`;

    // Sort documents by influence weight
    documents.sort((a, b) => (b.influenceScore || 0) - (a.influenceScore || 0));

    let totalInfluence = documents.reduce((sum, doc) => sum + (doc.influenceScore || 0), 0);
    if (totalInfluence === 0) totalInfluence = 1; // Prevent division by zero

    for (const doc of documents) {
        const influencePercent = Math.round(((doc.influenceScore || 0) / totalInfluence) * 100);
        if (influencePercent > 0) {
            response += `\n📄 Document: "${doc.name}" (Influence: ${influencePercent}%)\n`;
            response += `Extracted Content:\n${doc.content.slice(0, 600)}\n`; // Taking a meaningful snippet
        }
    }

    response += `\nThe AI will now refine this response while respecting document influence distribution.`;
    return response;
}

/**
 * Calls Claude API with structured response draft.
 */
async function generateAnthropicResponse(query: string, documents: Document[]): Promise<ResponsePayload> {
  const activeDocuments = documents.filter(doc => !doc.excluded);

  if (activeDocuments.length === 0) {
    return {
      content: "I don't have any documents to reference. Please upload some documents so I can provide insights based on them.",
      attributions: [{
        text: "I don't have any documents to reference.",
        source: 'base',
        confidence: 1.0
      }],
      attributionData: {
        baseKnowledge: 100,
        documents: []
      }
    };
  }

  const draftResponse = buildDraftResponse(query, activeDocuments);

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
          content: "You are an AI that refines structured drafts while maintaining the given influence distribution."
        },
        {
          role: 'user',
          content: draftResponse
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

  return {
    content: generatedContent,
    attributions: [], // Attribution processing to be added later
    attributionData: {
      baseKnowledge: 100 - documents.reduce((sum, doc) => sum + (doc.influenceScore || 0), 0),
      documents: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        contribution: Math.round((doc.influenceScore || 0) * 100),
      })),
    },
  };
}

/**
 * Mock response generator (if Claude API fails or is unavailable).
 */
async function generateMockResponse(query: string, documents: Document[]): Promise<ResponsePayload> {
  return {
    content: `This is a mock response to: "${query}". The actual implementation will incorporate document influence.`,
    attributions: [],
    attributionData: {
      baseKnowledge: 100,
      documents: []
    }
  };
}
