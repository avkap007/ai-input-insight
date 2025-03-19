
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
      const response = await generateMockResponse(query, documents);
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
  systemPrompt += "Your response should reflect the writing style, tone, and themes of the weighted documents. ";
  systemPrompt += "If creating a story, mimic the narrative style of the most influential documents. ";
  
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
  
  // Create more precise attributions by analyzing the response
  // In a real implementation, this would use more sophisticated NLP techniques
  return createAttributions(generatedContent, documentContext);
}

async function generateMockResponse(query: string, documents: Document[]): Promise<ResponsePayload> {
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
  
  // Generate story or content based on query type
  let content = '';
  
  if (query.toLowerCase().includes('story') || query.toLowerCase().includes('adventure')) {
    // Generate a story with influences from the documents
    content = generateStory(query, normalizedDocuments);
  } else {
    // Generate a general response
    content = generateGeneralResponse(query, normalizedDocuments);
  }
  
  // Add information about data poisoning if any documents are poisoned
  const poisonedDocs = normalizedDocuments.filter(doc => doc.poisoningLevel && doc.poisoningLevel > 0);
  if (poisonedDocs.length > 0) {
    content += "\n\nNote: Some of the source documents have simulated data poisoning applied, which may affect the reliability of this response.";
  }
  
  // Create more precise attributions by analyzing the response
  const documentContext = normalizedDocuments.map(doc => ({
    id: doc.id,
    name: doc.name,
    content: doc.content,
    influenceWeight: doc.normalizedInfluence
  }));
  
  return createAttributions(content, documentContext);
}

function generateStory(query: string, documents: Document[]) {
  // Basic story template that will be influenced by documents
  const storyTemplate = {
    intro: "Once upon a time, there was a child named Alex who was always curious about the world around them.",
    setting: "After school one day, as the afternoon sun cast long shadows across the playground,",
    conflict: "Alex noticed something unusual that caught their attention.",
    development: "Driven by curiosity, Alex decided to investigate, not knowing what adventure awaited.",
    resolution: "By the end of the afternoon, Alex had learned something new about the world and about themselves.",
    conclusion: "As they headed home, Alex couldn't wait to share this adventure with their family."
  };
  
  // Modify the story based on document influences
  let story = '';
  
  for (const doc of documents) {
    // Style adjustments based on document content
    if (doc.name.toLowerCase().includes('rowling') || 
        doc.content.toLowerCase().includes('magic') || 
        doc.content.toLowerCase().includes('wand')) {
      // Magical elements
      storyTemplate.setting = "After school one day, as the afternoon sun cast magical golden light through the classroom windows,";
      storyTemplate.conflict = "Alex noticed a strange shimmering in the air near the old oak tree, something only they could see.";
      storyTemplate.development = "With heart racing, Alex approached the shimmering light, suddenly feeling drawn to it by some unseen force.";
      
      // Weight this influence by the document's influence score
      if ((doc.influenceScore || 0.5) > 0.6) {
        storyTemplate.resolution = "The shimmering revealed a tiny door at the base of the tree, and inside Alex discovered a miniature world of creatures who needed help with an important mission.";
      }
    }
    
    if (doc.name.toLowerCase().includes('rooney') || 
        doc.content.toLowerCase().includes('relationships') || 
        doc.content.toLowerCase().includes('connections')) {
      // Relationship focus
      storyTemplate.intro = "Alex, a thoughtful seven-year-old with observant eyes, often noticed things that others missed about the people around them.";
      
      // Weight this influence by the document's influence score
      if ((doc.influenceScore || 0.5) > 0.6) {
        storyTemplate.conflict = "Alex noticed their friend Sam sitting alone on a bench, looking sad and withdrawn, something very unusual for usually cheerful Sam.";
        storyTemplate.development = "Instead of joining the other kids at play, Alex decided to sit with Sam, carefully finding the right words to ask what was wrong.";
        storyTemplate.resolution = "Through patient listening and simple kindness, Alex helped Sam open up about moving to a new house, and together they made a plan to stay connected.";
      }
    }
    
    if (doc.name.toLowerCase().includes('orwell') || 
        doc.content.toLowerCase().includes('dystopian') || 
        doc.content.toLowerCase().includes('control')) {
      // Darker, more suspicious tone
      storyTemplate.setting = "After the school bell rang, signaling the strictly regulated end of the learning period,";
      
      // Weight this influence by the document's influence score
      if ((doc.influenceScore || 0.5) > 0.6) {
        storyTemplate.conflict = "Alex noticed the new security cameras that had been installed around the playground, their mechanical eyes following each child's movement.";
        storyTemplate.development = "Curious about what happened to the recordings, Alex decided to follow the wires leading from one of the cameras, careful to stay out of sight of the monitoring system.";
        storyTemplate.resolution = "Behind the school, Alex discovered an unused maintenance room where all the security feeds were displayed but no one was watching them - the illusion of surveillance was just that, an illusion.";
      }
    }
    
    if (doc.name.toLowerCase().includes('poetic') || 
        doc.content.toLowerCase().includes('morning light') || 
        doc.content.toLowerCase().includes('delicate')) {
      // More poetic, descriptive language
      storyTemplate.intro = "Seven-year-old Alex, with wonder-filled eyes the color of autumn leaves, saw the world as a canvas of possibilities waiting to be explored.";
      storyTemplate.setting = "As the final school bell echoed through the corridors and faded into silence, golden afternoon light spilled across the playground, transforming ordinary objects into treasures aglow.";
      
      // Weight this influence by the document's influence score
      if ((doc.influenceScore || 0.5) > 0.6) {
        storyTemplate.conclusion = "Walking home with pockets full of small discoveries - a perfect robin's feather, a uniquely shaped stone, and a head full of stories - Alex felt the day fold itself into memory, another page in the book of childhood adventures.";
      }
    }
  }
  
  // Assemble the story based on the modified template
  story = `${storyTemplate.intro} ${storyTemplate.setting} ${storyTemplate.conflict} ${storyTemplate.development} ${storyTemplate.resolution} ${storyTemplate.conclusion}`;
  
  return story;
}

function generateGeneralResponse(query: string, documents: Document[]) {
  // Start with a generic response
  let response = `Based on the documents you've provided, I can offer the following insights on "${query}":\n\n`;
  
  // Add content from each document weighted by influence
  for (const doc of documents) {
    const influence = doc.influenceScore || 0.5;
    
    // Extract key phrases from the document content
    const sentences = doc.content.split(/[.!?]/).filter(s => s.trim().length > 0);
    
    // Select a number of sentences based on influence (higher influence = more content)
    const sentenceCount = Math.max(1, Math.floor(sentences.length * influence));
    const selectedSentences = sentences.slice(0, sentenceCount);
    
    // Add this document's contribution to the response
    if (selectedSentences.length > 0) {
      response += `From ${doc.name}: ${selectedSentences.join(". ")}.\n\n`;
    }
  }
  
  response += "This analysis is based on the documents you've provided, weighted according to the influence levels you've set.";
  
  return response;
}

function createAttributions(content: string, documentContext: any[]): ResponsePayload {
  // Split content into sentences for attribution
  const sentences = content.split(/(?<=[.!?])\s+/);
  const attributions: TokenAttribution[] = [];
  
  // Base knowledge percentage (inverse of total normalized influence)
  const basePercentage = 40; // Fixed base percentage
  
  // Create attribution data with document contributions based on influence
  const attributionData: AttributionData = {
    baseKnowledge: basePercentage,
    documents: documentContext.map(doc => ({
      id: doc.id,
      name: doc.name,
      contribution: Math.round((100 - basePercentage) * doc.influenceWeight)
    }))
  };
  
  // Analyze each sentence to attribute it to either base knowledge or a document
  sentences.forEach((sentence, index) => {
    // Simple attribution algorithm (in reality, this would be much more sophisticated)
    // We'll randomly assign sentences to documents based on their influence weight,
    // with some sentences coming from base knowledge
    
    // Determine if this sentence comes from base knowledge
    const isBaseKnowledge = Math.random() < (basePercentage / 100);
    
    if (isBaseKnowledge) {
      attributions.push({
        text: sentence + (index < sentences.length - 1 ? " " : ""),
        source: 'base',
        confidence: 0.7 + (Math.random() * 0.3) // Random confidence between 0.7 and 1.0
      });
    } else {
      // Select a document based on influence weights
      let targetValue = Math.random() * (100 - basePercentage) / 100;
      let cumulativeWeight = 0;
      let selectedDoc = documentContext[0]; // Default to first document
      
      for (const doc of documentContext) {
        cumulativeWeight += doc.influenceWeight;
        if (cumulativeWeight / (100 - basePercentage) * 100 >= targetValue) {
          selectedDoc = doc;
          break;
        }
      }
      
      attributions.push({
        text: sentence + (index < sentences.length - 1 ? " " : ""),
        source: 'document',
        documentId: selectedDoc.id,
        confidence: 0.6 + (selectedDoc.influenceWeight * 0.4) // Higher influence = higher confidence
      });
    }
  });
  
  return {
    content,
    attributions,
    attributionData
  };
}
