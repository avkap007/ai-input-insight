
// Utility functions for content analysis features

// Sentiment analysis - returns a score between -1 (negative) and 1 (positive)
export const analyzeSentiment = (text: string): number => {
  // Simple implementation that counts positive and negative words
  const positiveWords = [
    'good', 'great', 'excellent', 'positive', 'happy', 'joy', 'love', 'like', 'best', 'beautiful',
    'wonderful', 'amazing', 'fantastic', 'delightful', 'pleased', 'glad', 'cheerful', 'successful',
    'perfect', 'impressive', 'awesome', 'brilliant', 'exciting', 'thrilled', 'fun', 'enjoy'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'negative', 'sad', 'hate', 'dislike', 'worst', 'poor', 'horrible',
    'disappointed', 'disappointing', 'failure', 'fail', 'unfortunately', 'disaster', 'tragic',
    'annoying', 'miserable', 'gloomy', 'dreadful', 'unhappy', 'upset', 'angry', 'fear', 'worried'
  ];
  
  // Additional processing for negation
  const words = text.toLowerCase().split(/\W+/);
  
  let positiveCount = 0;
  let negativeCount = 0;
  let negationActive = false;
  
  words.forEach((word, index) => {
    // Check for negation words
    if (['not', 'no', "don't", "doesn't", "didn't", "won't", "wouldn't", "couldn't", "shouldn't"].includes(word)) {
      negationActive = true;
      return;
    }
    
    // Apply negation if active
    if (negationActive) {
      if (positiveWords.includes(word)) {
        negativeCount++;
      } else if (negativeWords.includes(word)) {
        positiveCount++;
      }
      
      // Reset negation after applying it
      negationActive = false;
    } else {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    }
  });
  
  const totalWords = words.length;
  if (totalWords === 0) return 0;
  
  // Calculate sentiment score, normalized by document length
  return (positiveCount - negativeCount) / Math.max(1, Math.min(totalWords / 20, 5));
};

// Bias detection - returns an object with different bias types and their scores
export const detectBias = (text: string): Record<string, number> => {
  // Types of bias to detect with more comprehensive word lists
  const biasTypes = {
    gender: [
      'he', 'she', 'man', 'woman', 'male', 'female', 'boy', 'girl', 'masculine', 'feminine',
      'gender', 'sexist', 'patriarchy', 'matriarchy', 'husband', 'wife', 'daughter', 'son',
      'mother', 'father', 'sister', 'brother'
    ],
    political: [
      'liberal', 'conservative', 'democrat', 'republican', 'right', 'left', 'progressive',
      'government', 'policy', 'legislation', 'regulation', 'freedom', 'rights', 'tax',
      'socialist', 'capitalist', 'election', 'vote', 'democracy', 'autocracy', 'party'
    ],
    age: [
      'young', 'old', 'elder', 'youth', 'millennial', 'boomer', 'generation', 'retirement',
      'senior', 'student', 'teenager', 'adult', 'child', 'adolescent', 'mature', 'experienced'
    ],
    ethnicity: [
      'white', 'black', 'asian', 'hispanic', 'latino', 'african', 'european', 'race', 'racial',
      'ethnic', 'minority', 'diversity', 'multicultural', 'indigenous', 'native', 'immigrant',
      'nationality', 'heritage', 'culture', 'background'
    ]
  };
  
  const words = text.toLowerCase().split(/\W+/);
  const results: Record<string, number> = {};
  
  // Calculate mentions of each bias type
  Object.entries(biasTypes).forEach(([biasType, biasWords]) => {
    const count = words.filter(word => biasWords.includes(word)).length;
    
    // More sophisticated scoring that accounts for text length
    const textLength = words.length;
    results[biasType] = Math.min(count / Math.max(1, textLength / 50), 1);
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
  
  // Source count factor (more sources = higher score, up to a point)
  const sourceCountFactor = Math.min(sourceCount / 5, 1);
  
  // Combine scores with weights
  return (diversityScore * 0.5) + (baseKnowledgeScore * 0.3) + (sourceCountFactor * 0.2);
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
      if (Math.random() < 0.3) {
        continue; // Skip this sentence (30% chance)
      } else {
        // Modify the sentence (70% chance)
        const sentence = sentences[i];
        const sentiment = analyzeSentiment(sentence);
        
        if (sentiment > 0.2) {
          // For positive sentences, add negation or opposite sentiment
          const modifiedSentence = sentence
            .replace(/\b(is|are|was|were)\b/g, '$1 not')
            .replace(/\bgood\b/g, 'bad')
            .replace(/\bexcellent\b/g, 'terrible')
            .replace(/\bbeautiful\b/g, 'ugly')
            .replace(/\bhappy\b/g, 'sad');
          poisonedContent.push(modifiedSentence);
        } else if (sentiment < -0.2) {
          // For negative sentences, remove negation or add positive sentiment
          const modifiedSentence = sentence
            .replace(/\b(is|are|was|were) not\b/g, '$1')
            .replace(/\bbad\b/g, 'good')
            .replace(/\bterrible\b/g, 'excellent')
            .replace(/\bugly\b/g, 'beautiful')
            .replace(/\bsad\b/g, 'happy');
          poisonedContent.push(modifiedSentence);
        } else {
          // For neutral sentences, potentially introduce misleading information
          if (Math.random() < 0.5) {
            poisonedContent.push(`${sentence} However, this is not entirely accurate.`);
          } else {
            poisonedContent.push(sentence);
          }
        }
      }
    } else {
      poisonedContent.push(sentences[i]);
    }
  }
  
  return poisonedContent.join(' ');
};
