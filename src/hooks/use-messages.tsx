
import { useState, useCallback } from 'react';
import { Message, Document, TokenAttribution, AttributionData, AnalysisData } from '@/types';
import { saveMessage, getMessages } from '@/services/chatService';
import { responseClient, analysisClient } from '@/utils/apiClients';
import { toast } from '@/components/ui/use-toast';

export const useMessages = (chatSessionId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load initial messages when component mounts with a valid chat session ID
  const loadMessages = useCallback(async () => {
    if (!chatSessionId) return;
    
    try {
      const loadedMessages = await getMessages(chatSessionId);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [chatSessionId]);

  // Send a new message and get AI response
  const handleSendMessage = useCallback(async (content: string, documents: Document[]) => {
    if (!chatSessionId || !content.trim()) return;
    
    try {
      setIsProcessing(true);
      
      // Save user message
      const userMessage: Omit<Message, 'id'> = {
        role: 'user',
        content,
        timestamp: new Date(),
      };
      
      const savedUserMessage = await saveMessage(chatSessionId, userMessage);
      setMessages(prevMessages => [...prevMessages, savedUserMessage]);
      
      // Generate AI response
      console.log(`Sending request with ${documents.length} documents`);
      const response = await responseClient.generateResponse(content, documents);
      
      if (!response) {
        throw new Error('Failed to generate response');
      }
      
      // Extract data from response
      const generatedText = response.generated_text || "I couldn't generate a response at this time.";
      const attributions: TokenAttribution[] = response.attributions || [];
      
      // Create attribution data for pie chart
      const attributionData: AttributionData = response.attributionData || {
        baseKnowledge: 100,
        documents: documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          contribution: 0
        }))
      };
      
      // Analyze response for sentiment, bias, and trust
      let analysisData: AnalysisData | null = null;
      
      try {
        // Get sentiment analysis
        const sentimentResponse = await analysisClient.analyzeSentiment(generatedText);
        const sentiment = sentimentResponse?.sentiment_score || 0;
        
        // Get bias analysis
        const biasResponse = await analysisClient.detectBias(generatedText);
        const bias = biasResponse?.bias_scores || { political: 0.2, gender: 0.1 };
        
        // Calculate trust score
        const baseKnowledgePercentage = attributionData.baseKnowledge;
        const documentContributions = attributionData.documents;
        
        const trustResponse = await analysisClient.calculateTrustScore(
          baseKnowledgePercentage,
          documentContributions
        );
        
        const trustScore = trustResponse?.trust_score || 0.5;
        
        // Combine all analysis data
        analysisData = {
          sentiment,
          bias,
          trustScore
        };
      } catch (error) {
        console.error('Error analyzing response:', error);
        analysisData = {
          sentiment: 0,
          bias: { political: 0.2, gender: 0.1 },
          trustScore: 0.5
        };
      }
      
      // Save AI message
      const aiMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: generatedText,
        timestamp: new Date(),
        attributions,
        attributionData,
        analysisData
      };
      
      const savedAiMessage = await saveMessage(chatSessionId, aiMessage);
      setMessages(prevMessages => [...prevMessages, savedAiMessage]);
    } catch (error) {
      console.error('Error in message flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your request.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [chatSessionId]);

  return {
    messages,
    isProcessing,
    handleSendMessage,
    loadMessages
  };
};
