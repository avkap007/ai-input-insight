import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';
import { Document, Message, TokenAttribution, AttributionData } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getDocuments, saveDocument, deleteDocument, updateDocumentInfluence } from '@/services/documentService';
import { createChatSession, getMessages, saveMessage } from '@/services/chatService';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const sessionId = await createChatSession();
        setChatSessionId(sessionId);
        
        const docs = await getDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast({
          title: "Error",
          description: "Failed to initialize the application. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    
    initializeChat();
  }, []);

  const handleDocumentUpload = async (document: Document) => {
    try {
      const savedDocument = await saveDocument(document);
      setDocuments(prev => [...prev, savedDocument]);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error saving your document.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast({
        title: "Document removed",
        description: "The document has been removed from your sources.",
      });
    } catch (error) {
      console.error("Error removing document:", error);
      toast({
        title: "Removal failed",
        description: "There was an error removing the document.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDocumentInfluence = async (id: string, influenceScore: number) => {
    try {
      await updateDocumentInfluence(id, influenceScore);
      setDocuments(prev => prev.map(doc => 
        doc.id === id ? { ...doc, influenceScore } : doc
      ));
      toast({
        title: "Influence updated",
        description: `Document influence set to ${Math.round(influenceScore * 100)}%`,
      });
    } catch (error) {
      console.error("Error updating document influence:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating document influence.",
        variant: "destructive",
      });
    }
  };

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
      
      const response = await supabase.functions.invoke('generate-response', {
        body: { query: content, documents },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const { data } = response;
      
      const assistantMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };
      
      const savedAssistantMessage = await saveMessage(chatSessionId, assistantMessage);
      
      savedAssistantMessage.attributions = data.attributions;
      savedAssistantMessage.attributionData = data.attributionData;
      
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/4 p-6 border-r border-gray-100 bg-gray-50">
          <DocumentUpload 
            onDocumentUpload={handleDocumentUpload}
            documents={documents}
            onRemoveDocument={handleRemoveDocument}
            onUpdateDocumentInfluence={handleUpdateDocumentInfluence}
          />
        </div>
        
        <div className="flex-1">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
