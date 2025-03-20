// Utility functions for content analysis features

const API_BASE_URL = "http://127.0.0.1:8000";

// Sentiment analysis using FastAPI
export const analyzeSentiment = async (text: string): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-sentiment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Sentiment analysis failed");
    }

    const data = await response.json();
    return data.sentiment_score || 0;
  } catch (error) {
    console.error("Sentiment API failed, falling back to local analysis:", error);
    return localAnalyzeSentiment(text);
  }
};

// Bias detection using FastAPI
export const detectBias = async (text: string): Promise<Record<string, number>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/detect-bias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Bias detection failed");
    }

    const data = await response.json();
    return data.bias_scores || {};
  } catch (error) {
    console.error("Bias API failed, falling back to local detection:", error);
    return localDetectBias(text);
  }
};

// Trust score calculation using FastAPI
export const calculateTrustScore = async (
  baseKnowledgePercentage: number,
  documentContributions: { contribution: number }[]
): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/calculate-trust-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseKnowledgePercentage, documentContributions }),
    });

    if (!response.ok) {
      throw new Error("Trust score calculation failed");
    }

    const data = await response.json();
    return data.trust_score || 0.5;
  } catch (error) {
    console.error("Trust score API failed, falling back to local calculation:", error);
    return localCalculateTrustScore(baseKnowledgePercentage, documentContributions);
  }
};

// Local fallback implementations
const localAnalyzeSentiment = (text: string): number => {
  // Basic word-matching method
  return text.includes("good") ? 0.5 : text.includes("bad") ? -0.5 : 0;
};

const localDetectBias = (text: string): Record<string, number> => {
  return { political: text.includes("government") ? 0.8 : 0.2 };
};

const localCalculateTrustScore = (
  baseKnowledgePercentage: number,
  documentContributions: { contribution: number }[]
): number => {
  return (baseKnowledgePercentage / 100 + documentContributions.length / 10) / 2;
};
