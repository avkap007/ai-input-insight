import { useState } from "react";
import { Message, Document } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { responseClient } from "@/utils/apiClients"; // Ensure this exists
import { analyzeSentiment, detectBias, calculateTrustScore } from "@/utils/contentAnalysis";
import { saveMessage } from "@/services/chatService"; // Ensure this exists
import { v4 as uuidv4 } from "uuid";

export const useMessages = (chatSessionId: string | null, documents: Document[]) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (!chatSessionId) {
      toast({
        title: "Error",
        description: "Chat session not initialized.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Omit<Message, "id"> = {
      role: "user",
      content,
      timestamp: new Date(),
    };

    try {
      const savedUserMessage = await saveMessage(chatSessionId, userMessage);
      setMessages((prev) => [...prev, savedUserMessage]);
      setIsProcessing(true);

      console.log(`Sending request with ${documents.length} documents`);
      const { generated_text, attributions, attributionData } = await responseClient.generateResponse(content, documents);

      if (!generated_text) throw new Error("Invalid AI response");

      // Async analysis
      const [sentiment, bias, trustScore] = await Promise.all([
        analyzeSentiment(generated_text),
        detectBias(generated_text),
        calculateTrustScore(attributionData?.baseKnowledge || 50, attributionData?.documents || []),
      ]);

      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: generated_text,
        timestamp: new Date(),
        analysisData: { sentiment, bias, trustScore },
        attributions,
        attributionData,
      };

      const savedAssistantMessage = await saveMessage(chatSessionId, assistantMessage);
      setMessages((prev) => [...prev, savedAssistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process message.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { messages, setMessages, isProcessing, handleSendMessage };
};
