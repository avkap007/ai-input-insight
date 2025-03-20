
import { useState } from "react";
import { Message, Document } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { responseClient } from "@/utils/apiClients";
import { analysisClient } from "@/utils/apiClients";
import { v4 as uuidv4 } from "uuid";

// Changed to accept a chatSessionId parameter, but make it optional with default value of null
export const useMessages = (chatSessionId: string | null = null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Updated handleSendMessage to accept documents as a parameter
  const handleSendMessage = async (content: string, documents: Document[]) => {
    try {
      // Add user message to the UI immediately
      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, userMessage]);
      setIsProcessing(true);

      // Prepare documents for the API request
      const docsForRequest = documents.map(doc => ({
        id: doc.id,
        influence: doc.influenceScore,
        excluded: doc.excluded || false,
        poisoningLevel: doc.poisoningLevel || 0
      }));

      console.log(`Sending request with ${docsForRequest.length} documents`);
      
      // Get AI response
      const response = await responseClient.generateResponse(content, docsForRequest);
      
      if (!response || !response.generated_text) {
        throw new Error("Invalid response from AI");
      }

      // Process the analysis asynchronously
      const generatedText = response.generated_text;
      let sentiment = 0;
      let bias = { political: 0.2 };
      let trustScore = 0.5;
      
      try {
        // Run analysis in parallel
        [sentiment, bias, trustScore] = await Promise.all([
          analysisClient.analyzeSentiment(generatedText),
          analysisClient.detectBias(generatedText),
          analysisClient.calculateTrustScore(
            response.attributionData?.baseKnowledge || 50,
            response.attributionData?.documents || []
          )
        ]);
      } catch (analysisError) {
        console.error("Error during analysis:", analysisError);
        // Continue with default values if analysis fails
      }

      // Create and add assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: generatedText,
        timestamp: new Date(),
        analysisData: { sentiment, bias, trustScore },
        attributions: response.attributions || [],
        attributionData: response.attributionData || {
          baseKnowledge: 100,
          documents: []
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      
      toast({
        title: "Error",
        description: "Failed to process message. Please try again.",
        variant: "destructive",
      });
      
      // Add error message so user knows what happened
      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "I'm sorry, I couldn't process your request. Please try again later.",
        timestamp: new Date(),
        analysisData: { sentiment: 0, bias: { political: 0 }, trustScore: 0 },
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return { messages, setMessages, isProcessing, handleSendMessage };
};
