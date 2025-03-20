
import { useState } from 'react';
import { Message, Document } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { saveMessage, saveTokenAttributions, saveAttributionData } from '@/services/chatService';
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
      
      console.log(`Sending request with ${processedDocuments.length} documents`);
      const response = await supabase.functions.invoke('generate-response', {
        body: { query: content, documents: processedDocuments },
      });
      
      if (response.error) {
        console.error("Error from generate-response function:", response.error);
        throw new Error(response.error.message);
      }
      
      const { data } = response;
      console.log("Response received from generate-response function");
      
      // Validate that we received a proper response with content
      if (!data || !data.generated_text) {
        console.error("Invalid response from generate-response:", data);
        throw new Error("Invalid response from AI service");
      }
      
      // Add analysis data - ensuring we have text to analyze
      let analysisData = {
        sentiment: 0,
        bias: {},
        trustScore: 50
      };
      
      if (typeof data.generated_text === 'string') {
        const sentiment = analyzeSentiment(data.generated_text);
        const bias = detectBias(data.generated_text);
        const trustScore = calculateTrustScore(
          data.attributionData?.baseKnowledge || 50,
          data.attributionData?.documents || []
        );
        
        analysisData = {
          sentiment,
          bias,
          trustScore
        };
      } else {
        console.warn("Generated text is not a string, skipping analysis");
      }
      
      const assistantMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: typeof data.generated_text === 'string' ? data.generated_text : String(data.generated_text),
        timestamp: new Date(),
      };
      
      const savedAssistantMessage = await saveMessage(chatSessionId, assistantMessage);
      
      // Save attributions and attribution data to database if they exist
      if (data.attributions && Array.isArray(data.attributions) && data.attributions.length > 0) {
        console.log(`Saving ${data.attributions.length} attributions`);
        await saveTokenAttributions(savedAssistantMessage.id, data.attributions);
      }
      
      if (data.attributionData) {
        console.log("Saving attribution data");
        await saveAttributionData(savedAssistantMessage.id, data.attributionData);
      }
      
      // Update the saved message with the additional data
      savedAssistantMessage.attributions = data.attributions || [];
      savedAssistantMessage.attributionData = data.attributionData || { 
        baseKnowledge: 50, 
        documents: [] 
      };
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
