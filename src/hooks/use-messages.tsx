
import { useState, useCallback, useEffect } from 'react';
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

  // Load messages when chatSessionId changes
  useEffect(() => {
    if (chatSessionId) {
      loadMessages();
    }
  }, [chatSessionId, loadMessages]);

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
      
      // Filter out any excluded documents
      const includedDocuments = documents.filter(doc => !doc.excluded);
      
      // Generate AI response
      console.log(`Sending request with ${includedDocuments.length} documents:`, includedDocuments);
      const response = await responseClient.generateResponse(content, includedDocuments);
      
      if (!response) {
        throw new Error('Failed to generate response');
      }
      
      // Extract data from response
      const generatedText = response.generated_text || "I couldn't generate a response at this time.";
      const attributions: TokenAttribution[] = response.attributions || [];
      
      // Create attribution data for pie chart
      // Calculate document contributions based on attribution data
      let baseKnowledgePercentage = 40; // Default value
      let documentContributions = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        contribution: 0
      }));
      
      // If we have real attribution data, process it
      if (response.attributionData) {
        baseKnowledgePercentage = response.attributionData.baseKnowledge || 40;
        documentContributions = response.attributionData.documents || documentContributions;
      }
      
      const attributionData: AttributionData = {
        baseKnowledge: baseKnowledgePercentage,
        documents: documentContributions
      };
      
      // Analyze response for sentiment, bias, and trust
      let analysisData: AnalysisData | null = null;
      
      try {
        // Get sentiment analysis
        const sentiment = await analysisClient.analyzeSentiment(generatedText);
        
        // Get bias analysis
        const biasData = await analysisClient.detectBias(generatedText);
        const bias = biasData.bias_scores || { political: 0.2, gender: 0.1 };
        
        // Calculate trust score based on attribution
        const trustScore = await analysisClient.calculateTrustScore(
          baseKnowledgePercentage,
          documentContributions
        );
        
        // Combine all analysis data
        analysisData = {
          sentiment,
          bias,
          trustScore
        };
        
        console.log("Analysis data:", analysisData);
      } catch (error) {
        console.error('Error analyzing response:', error);
        // Fallback data in case analysis fails
        analysisData = {
          sentiment: 0, // Neutral sentiment
          bias: { political: 0.2, gender: 0.1 },
          trustScore: 0.5 // Medium trust
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
        description: 'Failed to process your request. Please try again.',
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
