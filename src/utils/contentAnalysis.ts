
import { analysisClient } from "./apiClients";

// Sentiment analysis
export const analyzeSentiment = async (text: string): Promise<number> => {
  if (!text) {
    console.warn("No text provided for sentiment analysis");
    return 0;
  }
  
  try {
    return await analysisClient.analyzeSentiment(text);
  } catch (error) {
    console.error("Sentiment analysis failed, falling back to local analysis:", error);
    return localAnalyzeSentiment(text);
  }
};

// Bias detection
export const detectBias = async (text: string): Promise<Record<string, number>> => {
  if (!text) {
    console.warn("No text provided for bias detection");
    return { political: 0.2 };
  }
  
  try {
    return await analysisClient.detectBias(text);
  } catch (error) {
    console.error("Bias detection failed, falling back to local detection:", error);
    return localDetectBias(text);
  }
};

// Trust score calculation
export const calculateTrustScore = async (
  baseKnowledgePercentage: number,
  documentContributions: { id: string; name: string; contribution: number }[]
): Promise<number> => {
  try {
    return await analysisClient.calculateTrustScore(baseKnowledgePercentage, documentContributions);
  } catch (error) {
    console.error("Trust score calculation failed, falling back to local calculation:", error);
    return localCalculateTrustScore(baseKnowledgePercentage, documentContributions);
  }
};

// Local fallback implementations
const localAnalyzeSentiment = (text: string): number => {
  // Simple word-matching method
  const positiveWords = ['good', 'excellent', 'great', 'positive', 'wonderful', 'happy'];
  const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'horrible', 'sad'];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  // Count positive and negative words
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 0.1;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 0.1;
  });
  
  // Clamp between -1 and 1
  return Math.max(-1, Math.min(1, score));
};

const localDetectBias = (text: string): Record<string, number> => {
  const lowerText = text.toLowerCase();
  
  // Political bias detection
  let politicalBias = 0.2; // Default neutral
  if (lowerText.includes('government') || lowerText.includes('policy') || lowerText.includes('regulation')) {
    politicalBias = 0.6;
  }
  
  // Gender bias detection
  let genderBias = 0.1; // Default low
  const maleCount = (lowerText.match(/\b(he|him|his|man|men|male|boy|boys|himself)\b/g) || []).length;
  const femaleCount = (lowerText.match(/\b(she|her|hers|woman|women|female|girl|girls|herself)\b/g) || []).length;
  
  if (maleCount > 0 || femaleCount > 0) {
    const total = maleCount + femaleCount;
    const ratio = Math.abs((maleCount / total) - 0.5) * 2; // 0 for perfect balance, 1 for complete imbalance
    genderBias = ratio * 0.8; // Scale to 0.8 max
  }
  
  return {
    political: politicalBias,
    gender: genderBias
  };
};

const localCalculateTrustScore = (
  baseKnowledgePercentage: number,
  documentContributions: { id: string; name: string; contribution: number }[]
): number => {
  // If only using base knowledge, trust is moderate
  if (documentContributions.length === 0) {
    return 0.5;
  }
  
  // Calculate average contribution percentage
  const avgContribution = documentContributions.reduce(
    (sum, doc) => sum + (doc.contribution || 0), 0
  ) / documentContributions.length;
  
  // Balance factor: trust is higher when base knowledge and documents are balanced
  const baseKnowledge = baseKnowledgePercentage / 100;
  const docKnowledge = avgContribution / 100;
  
  // Balance formula: 1 - absolute difference between base and doc knowledge (scaled)
  const balance = 1 - Math.abs(baseKnowledge - docKnowledge);
  
  // Source diversity factor: more sources = higher trust (up to a point)
  const diversity = Math.min(documentContributions.length / 5, 1); // Max out at 5 sources
  
  // Final trust score formula
  const trustScore = 0.4 + (balance * 0.3) + (diversity * 0.3);
  
  // Ensure it's between 0 and 1
  return Math.max(0, Math.min(1, trustScore));
};
