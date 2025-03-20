
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
    
    console.log(`Received query: "${query}" with ${documents.length} documents`);

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
 * Prepares documents for processing by extracting key concepts and terms.
 */
function prepareDocumentsForAttribution(documents: Document[]): Record<string, string[]> {
  const documentKeyTerms: Record<string, string[]> = {};
  
  for (const doc of documents) {
    if (doc.excluded) continue;
    
    // Extract important terms from the document using basic NLP techniques
    const content = doc.content.toLowerCase();
    const words = content.split(/\W+/).filter(w => w.length > 4); // Only keep words longer than 4 chars
    
    // Count word frequencies
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Sort by frequency and get top terms
    const keyTerms = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30) // Take top 30 most frequent terms
      .map(([term]) => term);
    
    documentKeyTerms[doc.id] = keyTerms;
  }
  
  return documentKeyTerms;
}

/**
 * Analyzes a generated response to determine token attributions.
 */
function computeTokenAttribution(
  content: string, 
  documentKeyTerms: Record<string, string[]>,
  documents: Document[]
): TokenAttribution[] {
  const tokens = content.split(/\b/); // Split by word boundaries
  const attributions: TokenAttribution[] = [];
  
  // Build a map of terms to document IDs
  const termToDocMap: Record<string, string[]> = {};
  Object.entries(documentKeyTerms).forEach(([docId, terms]) => {
    terms.forEach(term => {
      if (!termToDocMap[term]) termToDocMap[term] = [];
      termToDocMap[term].push(docId);
    });
  });
  
  // Calculate influence weights
  const docInfluenceMap: Record<string, number> = {};
  documents.forEach(doc => {
    if (!doc.excluded) {
      docInfluenceMap[doc.id] = doc.influenceScore || 0;
    }
  });
  
  // Process each token
  let currentText = "";
  let currentSource: 'base' | 'document' = 'base';
  let currentDocId: string | undefined = undefined;
  let currentConfidence = 0;
  
  tokens.forEach(token => {
    const lowerToken = token.toLowerCase();
    
    // Skip whitespace and punctuation
    if (/^\s+$/.test(token) || /^[.,;:!?()[\]{}'"]+$/.test(token)) {
      currentText += token;
      return;
    }
    
    // Check if this token appears in our document key terms
    const matchingDocs = termToDocMap[lowerToken] || [];
    
    if (matchingDocs.length > 0) {
      // This token appears in at least one document
      
      // If we need to close the previous attribution
      if (currentText && (currentSource !== 'document' || currentDocId !== matchingDocs[0])) {
        if (currentText.trim()) {
          attributions.push({
            text: currentText,
            source: currentSource,
            documentId: currentDocId,
            confidence: currentConfidence
          });
        }
        currentText = "";
      }
      
      // Determine which document has the highest influence
      let bestDocId = matchingDocs[0];
      let highestInfluence = docInfluenceMap[bestDocId] || 0;
      
      matchingDocs.forEach(docId => {
        const influence = docInfluenceMap[docId] || 0;
        if (influence > highestInfluence) {
          highestInfluence = influence;
          bestDocId = docId;
        }
      });
      
      // Set the source to document
      currentSource = 'document';
      currentDocId = bestDocId;
      
      // Calculate confidence based on document influence and token specificity
      const tokenSpecificity = 1 / Math.max(1, matchingDocs.length); // Higher if token is unique to one doc
      currentConfidence = Math.min(0.95, 0.5 + (highestInfluence * tokenSpecificity)); 
      
      currentText += token;
    } else {
      // This token doesn't appear in our documents
      
      // If we need to close the previous attribution
      if (currentText && currentSource !== 'base') {
        if (currentText.trim()) {
          attributions.push({
            text: currentText,
            source: currentSource,
            documentId: currentDocId,
            confidence: currentConfidence
          });
        }
        currentText = "";
      }
      
      currentSource = 'base';
      currentDocId = undefined;
      currentConfidence = 0.7; // Base confidence for general knowledge
      
      currentText += token;
    }
  });
  
  // Add the final piece
  if (currentText.trim()) {
    attributions.push({
      text: currentText,
      source: currentSource,
      documentId: currentDocId,
      confidence: currentConfidence
    });
  }
  
  return attributions;
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

  console.log(`Making Anthropic API call with ${activeDocuments.length} active documents`);
  
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
          content: `You are an AI that generates content influenced by provided documents. Your response should reflect the style, tone, and knowledge from these documents based on their influence scores. Be detailed and creative in your response.`
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
    const errorText = await response.text();
    console.error(`Anthropic API error: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log("Successfully received response from Anthropic API");
  
  const generatedContent = result.content[0].text;
  
  // Prepare documents for attribution
  const documentKeyTerms = prepareDocumentsForAttribution(activeDocuments);
  
  // Compute attributions
  const attributions = computeTokenAttribution(generatedContent, documentKeyTerms, activeDocuments);
  
  // Calculate document contributions from attributions
  const docContributions: Record<string, number> = {};
  let totalDocWords = 0;
  let baseKnowledgeWords = 0;
  
  attributions.forEach(attr => {
    const wordCount = attr.text.split(/\s+/).filter(w => w.length > 0).length;
    if (attr.source === 'document' && attr.documentId) {
      docContributions[attr.documentId] = (docContributions[attr.documentId] || 0) + wordCount;
      totalDocWords += wordCount;
    } else if (attr.source === 'base') {
      baseKnowledgeWords += wordCount;
    }
  });
  
  const totalWords = totalDocWords + baseKnowledgeWords;
  const baseKnowledgePercentage = Math.round((baseKnowledgeWords / totalWords) * 100);
  
  // Prepare attribution data
  const attributionData: AttributionData = {
    baseKnowledge: baseKnowledgePercentage,
    documents: activeDocuments.map((doc) => ({
      id: doc.id,
      name: doc.name,
      contribution: Math.round(((docContributions[doc.id] || 0) / totalWords) * 100),
    })),
  };
  
  console.log("Attribution data calculated:", 
    `Base: ${baseKnowledgePercentage}%`, 
    "Docs:", attributionData.documents.map(d => `${d.name}: ${d.contribution}%`).join(', ')
  );

  return {
    content: generatedContent,
    attributions: attributions,
    attributionData: attributionData,
  };
}

/**
 * Builds a structured response using document influence before sending to Claude.
 */
function buildDraftResponse(query: string, documents: Document[]): string {
    let response = `The user asked: "${query}"\n\n`;
    response += `Your task is to provide a response that incorporates influence from these documents based on their influence scores:\n\n`;

    // Sort documents by influence weight
    documents.sort((a, b) => (b.influenceScore || 0) - (a.influenceScore || 0));

    // Include document content with influence scores
    for (const doc of documents) {
        const influencePercent = Math.round(((doc.influenceScore || 0)) * 100);
        response += `\n--- DOCUMENT: "${doc.name}" (Influence: ${influencePercent}%) ---\n`;
        
        // Add content either original or poisoned
        const content = doc.poisoningLevel && doc.poisoningLevel > 0 
            ? `[Note: This content has been altered with poisoning level ${Math.round(doc.poisoningLevel * 100)}%]:\n${doc.content.slice(0, 1000)}`
            : doc.content.slice(0, 1000);
            
        response += `${content}\n`;
        
        if (doc.content.length > 1000) {
            response += `[Content truncated - original length: ${doc.content.length} characters]\n`;
        }
    }

    response += `\n\nRespond to the user's query "${query}" incorporating appropriate influence from the above documents. Your response should reflect the style, terminology, and knowledge from these documents according to their influence percentages.`;
    return response;
}

/**
 * Mock response generator (if Claude API fails or is unavailable).
 */
async function generateMockResponse(query: string, documents: Document[]): Promise<ResponsePayload> {
  console.log("Generating mock response");
  
  const activeDocuments = documents.filter(doc => !doc.excluded);
  
  // Generate a simple response
  let mockContent = `Here's a response to your query: "${query}"\n\n`;
  
  if (activeDocuments.length === 0) {
    mockContent += "I don't have any documents to reference. Please upload some documents so I can provide insights based on them.";
    
    return {
      content: mockContent,
      attributions: [{
        text: mockContent,
        source: 'base',
        confidence: 1.0
      }],
      attributionData: {
        baseKnowledge: 100,
        documents: []
      }
    };
  }
  
  // Create a simple response using snippets from documents
  mockContent += "Based on the documents you've provided, I can tell you that:\n\n";
  
  // Sort documents by influence score
  activeDocuments.sort((a, b) => (b.influenceScore || 0) - (a.influenceScore || 0));
  
  // Add snippets from each document based on influence
  for (const doc of activeDocuments) {
    if (doc.influenceScore && doc.influenceScore > 0.1) {
      // Extract a snippet from the document
      const snippet = doc.content.split(/\.\s+/).slice(0, 2).join('. ') + '.';
      mockContent += `From ${doc.name}: "${snippet}"\n\n`;
    }
  }
  
  mockContent += "This is a mock response since the AI service is currently unavailable.";
  
  // Create mock attributions
  const parts = mockContent.split(/\n\n/);
  const attributions: TokenAttribution[] = [];
  
  parts.forEach((part, index) => {
    if (index === 0 || index === parts.length - 1) {
      // First and last parts are base knowledge
      attributions.push({
        text: part + (index < parts.length - 1 ? "\n\n" : ""),
        source: 'base',
        confidence: 0.9
      });
    } else if (part.startsWith("From ")) {
      // Extract document name from the part
      const docNameMatch = part.match(/From (.+?):/);
      if (docNameMatch) {
        const docName = docNameMatch[1];
        // Find the document
        const doc = activeDocuments.find(d => d.name === docName);
        
        if (doc) {
          attributions.push({
            text: part + "\n\n",
            source: 'document',
            documentId: doc.id,
            confidence: 0.8
          });
        } else {
          attributions.push({
            text: part + "\n\n",
            source: 'base',
            confidence: 0.7
          });
        }
      } else {
        attributions.push({
          text: part + "\n\n",
          source: 'base',
          confidence: 0.7
        });
      }
    } else {
      attributions.push({
        text: part + (index < parts.length - 1 ? "\n\n" : ""),
        source: 'base',
        confidence: 0.7
      });
    }
  });
  
  // Calculate attribution data
  const docContributions: Record<string, number> = {};
  activeDocuments.forEach(doc => {
    const influencePercent = Math.round(((doc.influenceScore || 0)) * 100);
    if (influencePercent > 0) {
      docContributions[doc.id] = influencePercent;
    }
  });
  
  const totalContribution = Object.values(docContributions).reduce((a, b) => a + b, 0);
  const baseKnowledge = Math.max(0, 100 - totalContribution);
  
  return {
    content: mockContent,
    attributions: attributions,
    attributionData: {
      baseKnowledge: baseKnowledge,
      documents: activeDocuments
        .filter(doc => (doc.influenceScore || 0) > 0)
        .map(doc => ({
          id: doc.id,
          name: doc.name,
          contribution: Math.round(((doc.influenceScore || 0)) * 100),
        })),
    },
  };
}
