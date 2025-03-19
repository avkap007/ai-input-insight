
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';
import { Document, Message, TokenAttribution, AttributionData, AnalysisData } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getDocuments, saveDocument, deleteDocument, updateDocumentInfluence } from '@/services/documentService';
import { createChatSession, getMessages, saveMessage } from '@/services/chatService';
import { analyzeSentiment, detectBias, calculateTrustScore, simulateDataPoisoning } from '@/utils/contentAnalysis';
import { useIsMobile } from '@/hooks/use-mobile';
import { SlidersHorizontal } from 'lucide-react';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    // On mobile, hide sidebar by default
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [isMobile]);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const sessionId = await createChatSession();
        setChatSessionId(sessionId);
        
        const docs = await getDocuments();
        // Initialize advanced properties
        const docsWithAdvancedProps = docs.map(doc => ({
          ...doc,
          poisoningLevel: 0,
          excluded: false
        }));
        setDocuments(docsWithAdvancedProps);
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
      // Add advanced properties
      const documentWithAdvancedProps: Document = {
        ...document,
        poisoningLevel: 0,
        excluded: false
      };
      
      const savedDocument = await saveDocument(documentWithAdvancedProps);
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
  
  // New handlers for advanced controls
  const handleUpdateDocumentPoisoning = (id: string, poisoningLevel: number) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, poisoningLevel } : doc
    ));
    
    toast({
      title: "Data poisoning updated",
      description: `Poisoning level set to ${Math.round(poisoningLevel * 100)}%`,
    });
  };
  
  const handleUpdateDocumentExclusion = (id: string, excluded: boolean) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, excluded } : doc
    ));
    
    toast({
      title: excluded ? "Document excluded" : "Document included",
      description: excluded 
        ? "Document will be excluded from AI response generation" 
        : "Document will be included in AI response generation",
    });
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
      
      // On mobile, hide sidebar when message is sent
      if (isMobile && showSidebar) {
        setShowSidebar(false);
      }
      
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
      
      const analysisData: AnalysisData = {
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

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row relative">
        {/* Mobile toggle button */}
        {isMobile && (
          <button 
            onClick={toggleSidebar}
            className="absolute top-2 left-2 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-md shadow-sm border border-gray-100"
            aria-label={showSidebar ? "Hide documents" : "Show documents"}
          >
            <SlidersHorizontal size={20} className={showSidebar ? "text-primary" : "text-gray-500"} />
          </button>
        )}
        
        {/* Sidebar overlay for mobile */}
        {isMobile && showSidebar && (
          <div 
            className="fixed inset-0 bg-black/20 z-10"
            onClick={() => setShowSidebar(false)}
          />
        )}
        
        {/* Document sidebar */}
        <div 
          className={`${
            isMobile 
              ? `fixed inset-y-0 left-0 z-10 w-5/6 max-w-xs bg-white shadow-lg transform transition-transform ${
                  showSidebar ? 'translate-x-0' : '-translate-x-full'
                }`
              : 'w-full lg:w-1/4 border-r border-gray-100 bg-gray-50'
          }`}
        >
          <div className="p-6 h-full overflow-y-auto">
            <DocumentUpload 
              onDocumentUpload={handleDocumentUpload}
              documents={documents}
              onRemoveDocument={handleRemoveDocument}
              onUpdateDocumentInfluence={handleUpdateDocumentInfluence}
              onUpdateDocumentPoisoning={handleUpdateDocumentPoisoning}
              onUpdateDocumentExclusion={handleUpdateDocumentExclusion}
            />
          </div>
        </div>
        
        {/* Chat interface */}
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
