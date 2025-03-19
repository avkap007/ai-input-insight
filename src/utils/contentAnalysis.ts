
// Utility functions for content analysis features

// Sentiment analysis - returns a score between -1 (negative) and 1 (positive)
export const analyzeSentiment = (text: string): number => {
  // Simple implementation that counts positive and negative words
  const positiveWords = ['good', 'great', 'excellent', 'positive', 'happy', 'joy', 'love', 'like', 'best', 'beautiful'];
  const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'sad', 'hate', 'dislike', 'worst', 'poor', 'horrible'];
  
  const words = text.toLowerCase().split(/\W+/);
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  const totalWords = words.length;
  if (totalWords === 0) return 0;
  
  return (positiveCount - negativeCount) / Math.max(1, Math.min(totalWords / 10, 10));
};

// Bias detection - returns an object with different bias types and their scores
export const detectBias = (text: string): Record<string, number> => {
  // Types of bias to detect
  const biasTypes = {
    gender: ['he', 'she', 'man', 'woman', 'male', 'female', 'boy', 'girl'],
    political: ['liberal', 'conservative', 'democrat', 'republican', 'right', 'left', 'progressive'],
    age: ['young', 'old', 'elder', 'youth', 'millennial', 'boomer', 'generation'],
    ethnicity: ['white', 'black', 'asian', 'hispanic', 'latino', 'african', 'european']
  };
  
  const words = text.toLowerCase().split(/\W+/);
  const results: Record<string, number> = {};
  
  // Calculate mentions of each bias type
  Object.entries(biasTypes).forEach(([biasType, biasWords]) => {
    const count = words.filter(word => biasWords.includes(word)).length;
    results[biasType] = Math.min(count / Math.max(1, words.length / 100), 1);
  });
  
  return results;
};

// Calculate trust score based on source diversity and confidence
export const calculateTrustScore = (
  baseKnowledgePercentage: number, 
  documentContributions: { contribution: number }[]
): number => {
  // More balanced sources = higher trust score
  const sourceCount = documentContributions.length;
  if (sourceCount === 0) return 0.5; // Neutral score with no documents
  
  // Calculate variance in document contributions (lower is better)
  const avgContribution = documentContributions.reduce((sum, doc) => sum + doc.contribution, 0) / sourceCount;
  const varianceSum = documentContributions.reduce((sum, doc) => {
    return sum + Math.pow(doc.contribution - avgContribution, 2);
  }, 0);
  const variance = varianceSum / sourceCount;
  
  // Diversity score (0-1) - higher when more balanced sources
  const diversityScore = Math.max(0, 1 - (variance / 500));
  
  // Base knowledge reliance (too much or too little reduces score)
  const optimalBaseKnowledge = 30; // Ideal percentage of base knowledge
  const baseKnowledgeScore = 1 - (Math.abs(baseKnowledgePercentage - optimalBaseKnowledge) / 100);
  
  // Combine scores with weights
  return (diversityScore * 0.6) + (baseKnowledgeScore * 0.4);
};

// Simulate data poisoning by corrupting document content
export const simulateDataPoisoning = (
  originalContent: string, 
  poisoningLevel: number // 0-1 scale
): string => {
  if (poisoningLevel <= 0) return originalContent;
  
  const sentences = originalContent.split(/(?<=[.!?])\s+/);
  let poisonedContent = [];
  
  for (let i = 0; i < sentences.length; i++) {
    // Skip sentence based on poisoning level
    if (Math.random() < poisoningLevel) {
      // Either skip this sentence or replace with opposite sentiment
      if (Math.random() < 0.5) {
        continue; // Skip this sentence
      } else {
        // Simple inversion: add "not" to positive sentences or remove from negative
        const sentiment = analyzeSentiment(sentences[i]);
        if (sentiment > 0.2) {
          poisonedContent.push(sentences[i].replace(/\b(is|are|was|were)\b/g, '$1 not'));
        } else if (sentiment < -0.2) {
          poisonedContent.push(sentences[i].replace(/\b(is|are|was|were) not\b/g, '$1'));
        } else {
          poisonedContent.push(sentences[i]);
        }
      }
    } else {
      poisonedContent.push(sentences[i]);
    }
  }
  
  return poisonedContent.join(' ');
};
