
import { useState, useCallback } from 'react';
import { Message, Document, TokenAttribution, AttributionData, AnalysisData } from '@/types';
import { responseClient } from '@/utils/apiClients';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Send a message and get AI response
  const handleSendMessage = useCallback(async (content: string, documents: Document[]) => {
    if (!content.trim()) return;
    
    try {
      setIsProcessing(true);
      
      // Add user message to state
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Filter out excluded documents
      const includedDocuments = documents.filter(doc => !doc.excluded);
      
      // Generate AI response
      const response = await responseClient.generateResponse(content, includedDocuments);
      
      if (!response) {
        throw new Error('Failed to generate response');
      }
      
      // Extract data from response
      const generatedText = response.generated_text || "I couldn't generate a response at this time.";
      const attributions: TokenAttribution[] = response.attributions || [];
      
      // Get attribution data
      const attributionData: AttributionData = response.attributionData || {
        baseKnowledge: 100,
        documents: []
      };
      
      // Get analysis data
      const analysisData: AnalysisData = response.analysisData || {
        sentiment: 0,
        bias: { political: 0.2, gender: 0.1 },
        trustScore: 0.5
      };
      
      // Add AI message to state
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: generatedText,
        timestamp: new Date(),
        attributions,
        attributionData,
        analysisData
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      
    } catch (error) {
      console.error('Error in message flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate response. Please check your connection and try again.',
        variant: 'destructive',
      });
      
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error generating a response. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Clear all messages
  const handleClearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isProcessing,
    handleSendMessage,
    handleClearMessages
  };
};
