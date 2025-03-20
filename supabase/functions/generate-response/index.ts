
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

// Type definitions
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
 * Extract important terms and key concepts from documents
 */
function prepareDocumentsForAttribution(documents: Document[]): Record<string, string[]> {
  console.log("Preparing documents for attribution analysis");
  const documentKeyTerms: Record<string, string[]> = {};
  
  for (const doc of documents) {
    if (doc.excluded) continue;
    
    // Extract important terms from the document using basic NLP techniques
    const content = doc.content.toLowerCase();
    // Split into words and filter out short words and common stopwords
    const stopwords = new Set(['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can']);
    const words = content.split(/\W+/).filter(w => w.length > 3 && !stopwords.has(w));
    
    // Count word frequencies
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Sort by frequency and get top terms
    const keyTerms = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50) // Take top 50 most frequent terms
      .map(([term]) => term);
    
    // Also extract key phrases (2-3 word combinations)
    const phrases = [];
    const contentWords = content.split(/\W+/).filter(w => w.length > 2);
    for (let i = 0; i < contentWords.length - 1; i++) {
      if (contentWords[i].length > 3 && contentWords[i+1].length > 3) {
        phrases.push(`${contentWords[i]} ${contentWords[i+1]}`);
      }
      if (i < contentWords.length - 2 && contentWords[i].length > 3 && contentWords[i+1].length > 3 && contentWords[i+2].length > 3) {
        phrases.push(`${contentWords[i]} ${contentWords[i+1]} ${contentWords[i+2]}`);
      }
    }
    
    // Count phrase frequencies
    const phraseCounts: Record<string, number> = {};
    phrases.forEach(phrase => {
      phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
    });
    
    // Add top phrases to key terms
    const keyPhrases = Object.entries(phraseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20) // Take top 20 phrases
      .map(([phrase]) => phrase);
    
    documentKeyTerms[doc.id] = [...keyTerms, ...keyPhrases];
    console.log(`Extracted ${documentKeyTerms[doc.id].length} key terms from document: ${doc.name}`);
  }
  
  return documentKeyTerms;
}

/**
 * Advanced token attribution that identifies source of generated content
 */
function computeTokenAttribution(
  content: string, 
  documentKeyTerms: Record<string, string[]>,
  documents: Document[]
): TokenAttribution[] {
  console.log("Computing token attribution for generated content");
  
  // Split content into sentences for more accurate attribution
  const sentences = content.split(/(?<=[.!?])\s+/);
  const attributions: TokenAttribution[] = [];
  
  // Build a map of terms to document IDs for quick lookup
  const termToDocMap: Record<string, string[]> = {};
  Object.entries(documentKeyTerms).forEach(([docId, terms]) => {
    terms.forEach(term => {
      if (!termToDocMap[term]) termToDocMap[term] = [];
      termToDocMap[term].push(docId);
    });
  });
  
  // Calculate influence weights for documents
  const docInfluenceMap: Record<string, number> = {};
  documents.forEach(doc => {
    if (!doc.excluded) {
      docInfluenceMap[doc.id] = doc.influenceScore || 0.5; // Default to 0.5 if not set
    }
  });
  
  // Process each sentence
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    
    // Count term matches per document for this sentence
    const docMatches: Record<string, number> = {};
    let totalMatches = 0;
    
    // Check for document key terms in this sentence
    Object.entries(documentKeyTerms).forEach(([docId, terms]) => {
      terms.forEach(term => {
        if (lowerSentence.includes(term.toLowerCase())) {
          docMatches[docId] = (docMatches[docId] || 0) + 1;
          totalMatches++;
        }
      });
    });
    
    if (totalMatches === 0 || Object.keys(docMatches).length === 0) {
      // No document matches, attribute to base knowledge
      attributions.push({
        text: sentence + ' ',
        source: 'base',
        confidence: 0.8
      });
    } else {
      // Find the document with the most matches, weighted by influence score
      let bestDocId = '';
      let bestScore = 0;
      
      Object.entries(docMatches).forEach(([docId, matches]) => {
        const score = matches * (docInfluenceMap[docId] || 0.5);
        if (score > bestScore) {
          bestScore = score;
          bestDocId = docId;
        }
      });
      
      // If the document influence is very low, still attribute to base knowledge
      if ((docInfluenceMap[bestDocId] || 0) < 0.1) {
        attributions.push({
          text: sentence + ' ',
          source: 'base',
          confidence: 0.7
        });
      } else {
        // Attribute to the most matching document
        attributions.push({
          text: sentence + ' ',
          source: 'document',
          documentId: bestDocId,
          confidence: Math.min(0.95, 0.6 + (totalMatches / 5) * (docInfluenceMap[bestDocId] || 0.5))
        });
      }
    }
  });
  
  return attributions;
}

/**
 * Calls Anthropic API directly with structured response draft.
 */
async function generateAnthropicResponse(query: string, documents: Document[]): Promise<ResponsePayload> {
  const activeDocuments = documents.filter(doc => !doc.excluded);

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

  console.log(`Making Anthropic API call with ${activeDocuments.length} active documents`);
  
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

  // Sort documents by influence weight
  activeDocuments.sort((a, b) => (b.influenceScore || 0.5) - (a.influenceScore || 0.5));

  // Include document content with influence scores
  for (const doc of activeDocuments) {
    const influencePercent = Math.round(((doc.influenceScore || 0.5)) * 100);
    userPrompt += `\n--- DOCUMENT: "${doc.name}" (Influence: ${influencePercent}%) ---\n`;
    
    // Add content either original or poisoned
    const content = doc.poisoningLevel && doc.poisoningLevel > 0 
        ? `[Note: This content has been altered with poisoning level ${Math.round(doc.poisoningLevel * 100)}%]:\n${doc.content.slice(0, 1000)}`
        : doc.content.slice(0, 1000);
        
    userPrompt += `${content}\n`;
    
    if (doc.content.length > 1000) {
        userPrompt += `[Content truncated - original length: ${doc.content.length} characters]\n`;
    }
  }

  try {
    console.log("API Key:", ANTHROPIC_API_KEY.substring(0, 5) + "...");
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
    const generatedContent = result.content[0].text;
    console.log("Generated content length:", generatedContent.length);
    
    // Prepare documents for attribution
    const documentKeyTerms = prepareDocumentsForAttribution(activeDocuments);
    
    // Compute attributions using NLP techniques
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
      documents: activeDocuments
        .filter(doc => (doc.influenceScore || 0) > 0)
        .map(doc => ({
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
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    throw error;
  }
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
  activeDocuments.sort((a, b) => (b.influenceScore || 0.5) - (a.influenceScore || 0.5));
  
  // Add snippets from each document based on influence
  for (const doc of activeDocuments) {
    if ((doc.influenceScore || 0.5) > 0.1) {
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
    const influencePercent = Math.round(((doc.influenceScore || 0.5)) * 100);
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
        .filter(doc => (doc.influenceScore || 0.5) > 0)
        .map(doc => ({
          id: doc.id,
          name: doc.name,
          contribution: Math.round(((doc.influenceScore || 0.5)) * 100),
        })),
    },
  };
}
