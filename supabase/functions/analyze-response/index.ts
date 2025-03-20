
import { serve } from "https://deno.land/std@0.199.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { generated_text } = await req.json();
    console.log("Analyzing text of length:", generated_text.length);
    
    // Implement simple sentiment analysis
    const sentiment = analyzeSentiment(generated_text);
    const biasIndicators = detectBias(generated_text);
    const trustScore = calculateTrustScore(sentiment, biasIndicators);
    
    console.log("Analysis complete:", {
      sentiment_value: sentiment,
      bias_indicators: biasIndicators,
      trust_score: trustScore
    });
    
    return new Response(JSON.stringify({
      sentiment: getSentimentLabel(sentiment),
      sentiment_value: sentiment,
      bias_indicators: biasIndicators,
      trust_score: trustScore
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-response function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Simple sentiment analysis function that returns a value between -1 (negative) and 1 (positive)
 */
function analyzeSentiment(text: string): number {
  const positiveWords = [
    'good', 'great', 'excellent', 'positive', 'happy', 'joy', 'love', 'like', 'best', 'beautiful',
    'wonderful', 'amazing', 'fantastic', 'delightful', 'pleased', 'glad', 'cheerful', 'successful',
    'perfect', 'impressive', 'awesome'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'negative', 'sad', 'hate', 'dislike', 'worst', 'poor', 'horrible',
    'disappointed', 'disappointing', 'failure', 'fail', 'unfortunately', 'disaster', 'tragic',
    'annoying', 'miserable', 'gloomy', 'dreadful'
  ];
  
  const words = text.toLowerCase().split(/\W+/);
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const word of words) {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  }
  
  const totalWords = words.length;
  if (totalWords === 0) return 0;
  
  return (positiveCount - negativeCount) / Math.max(1, Math.min(totalWords / 20, 5));
}

/**
 * Get sentiment label from numerical value
 */
function getSentimentLabel(sentiment: number): string {
  if (sentiment > 0.5) return "Very Positive";
  if (sentiment > 0.2) return "Positive";
  if (sentiment > -0.2) return "Neutral";
  if (sentiment > -0.5) return "Negative";
  return "Very Negative";
}

/**
 * Simple bias detection
 */
function detectBias(text: string): Record<string, number> {
  const biasCategories = {
    gender: [
      'he', 'she', 'man', 'woman', 'male', 'female', 'boy', 'girl', 'masculine', 'feminine',
      'gender', 'sexist'
    ],
    political: [
      'liberal', 'conservative', 'democrat', 'republican', 'right', 'left', 'progressive',
      'government', 'policy', 'legislation', 'regulation', 'freedom', 'rights', 'tax'
    ],
    age: [
      'young', 'old', 'elder', 'youth', 'millennial', 'boomer', 'generation', 'retirement',
      'senior', 'student', 'teenager', 'adult', 'child'
    ],
    ethnicity: [
      'white', 'black', 'asian', 'hispanic', 'latino', 'african', 'european', 'race', 'racial',
      'ethnic', 'minority', 'diversity', 'multicultural'
    ]
  };
  
  const words = text.toLowerCase().split(/\W+/);
  const results: Record<string, number> = {};
  
  Object.entries(biasCategories).forEach(([biasType, biasWords]) => {
    const count = words.filter(word => biasWords.includes(word)).length;
    const textLength = words.length;
    results[biasType] = Math.min(Math.round((count / Math.max(1, textLength / 50)) * 100), 100);
  });
  
  return results;
}

/**
 * Calculate trust score
 */
function calculateTrustScore(sentiment: number, biasIndicators: Record<string, number>): number {
  // Average bias indicator
  const biasValues = Object.values(biasIndicators);
  const avgBias = biasValues.reduce((sum, val) => sum + val, 0) / biasValues.length;
  
  // Lower trust for extreme sentiment or high bias
  const extremeSentiment = Math.abs(sentiment) > 0.7;
  const highBias = avgBias > 60;
  
  let trustScore = 65; // Baseline trust score
  
  if (extremeSentiment) trustScore -= 15;
  if (highBias) trustScore -= 20;
  
  // Ensure trust score is between 0 and 100
  return Math.max(0, Math.min(100, trustScore));
}
