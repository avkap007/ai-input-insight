
import { useState } from 'react';
import { Message, Document } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { saveMessage } from '@/services/chatService';
import { supabase } from '@/integrations/supabase/client';
import { analyzeSentiment, detectBias, calculateTrustScore, simulateDataPoisoning } from '@/utils/contentAnalysis';

export const useMessages = (chatSessionId: string | null, documents: Document[]) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (!chatSessionId) {
      toast({
        title: "Error",
        description: "Chat session not initialized. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    
    const userMessage: Omit<Message, 'id'> = {
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    try {
      const savedUserMessage = await saveMessage(chatSessionId, userMessage);
      setMessages(prev => [...prev, savedUserMessage]);
      setIsProcessing(true);
      
      // Prepare documents - apply data poisoning and handle exclusions
      const processedDocuments = documents
        .filter(doc => !doc.excluded)
        .map(doc => {
          if (doc.poisoningLevel && doc.poisoningLevel > 0) {
            return {
              ...doc,
              content: simulateDataPoisoning(doc.content, doc.poisoningLevel)
            };
          }
          return doc;
        });
      
      const response = await supabase.functions.invoke('generate-response', {
        body: { query: content, documents: processedDocuments },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const { data } = response;
      
      // Add analysis data
      const sentiment = analyzeSentiment(data.content);
      const bias = detectBias(data.content);
      const trustScore = calculateTrustScore(
        data.attributionData.baseKnowledge,
        data.attributionData.documents
      );
      
      const analysisData = {
        sentiment,
        bias,
        trustScore
      };
      
      const assistantMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };
      
      const savedAssistantMessage = await saveMessage(chatSessionId, assistantMessage);
      
      savedAssistantMessage.attributions = data.attributions;
      savedAssistantMessage.attributionData = data.attributionData;
      savedAssistantMessage.analysisData = analysisData;
      
      setMessages(prev => [...prev, savedAssistantMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    messages,
    setMessages,
    isProcessing,
    handleSendMessage
  };
};
