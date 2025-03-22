from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from textblob import TextBlob
from typing import Dict, List
import numpy as np

class AnalysisService:
    def __init__(self):
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
    
    def analyze_sentiment(self, text: str) -> float:
        """Combines VADER and TextBlob for sentiment analysis"""
        # VADER sentiment (primary)
        vader_scores = self.sentiment_analyzer.polarity_scores(text)
        vader_compound = vader_scores['compound']
        
        # TextBlob sentiment (secondary)
        blob = TextBlob(text)
        textblob_score = blob.sentiment.polarity
        
        # Weighted average (70% VADER, 30% TextBlob)
        final_score = (vader_compound * 0.7) + (textblob_score * 0.3)
        return max(-1, min(1, final_score))

    def detect_bias(self, text: str) -> Dict[str, float]:
        """Detects potential bias in text"""
        text_lower = text.lower()
        
        # Simple keyword-based bias detection
        political_keywords = {
            'left': ['liberal', 'progressive', 'democrat'],
            'right': ['conservative', 'republican', 'traditional']
        }
        
        gender_keywords = {
            'masculine': ['he', 'his', 'man', 'men'],
            'feminine': ['she', 'her', 'woman', 'women']
        }
        
        # Calculate bias scores
        political_bias = self._calculate_keyword_bias(text_lower, political_keywords)
        gender_bias = self._calculate_keyword_bias(text_lower, gender_keywords)
        
        return {
            "political": political_bias,
            "gender": gender_bias
        }

    def calculate_trust_score(
        self, 
        base_knowledge_percentage: float,
        document_contributions: List[Dict]
    ) -> float:
        """Calculates trust score based on source diversity and balance"""
        if not document_contributions:
            return 0.5
        
        # Source diversity (more sources = higher score, max 5)
        num_sources = len(document_contributions)
        diversity_score = min(1.0, num_sources / 5)
        
        # Balance between base knowledge and documents
        base_ratio = base_knowledge_percentage / 100
        balance_score = 1 - abs(0.5 - base_ratio)
        
        # Final weighted score
        trust_score = (diversity_score * 0.4) + (balance_score * 0.6)
        return max(0, min(1, trust_score))

    def _calculate_keyword_bias(
        self, 
        text: str, 
        keyword_groups: Dict[str, List[str]]
    ) -> float:
        """Helper method for keyword-based bias detection"""
        counts = {
            group: sum(1 for word in words if word in text)
            for group, words in keyword_groups.items()
        }
        
        total = sum(counts.values())
        if total == 0:
            return 0.1  # minimal bias if no keywords found
            
        # Calculate imbalance between groups
        values = list(counts.values())
        max_diff = max(abs(a - b) for a in values for b in values)
        bias_score = max_diff / (total + 1)  # +1 to avoid division by zero
        
        return min(1.0, bias_score)