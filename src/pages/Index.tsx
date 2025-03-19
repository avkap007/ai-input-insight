
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from '@/components/ui/use-toast';
import { getDocuments } from '@/services/documentService';
import { createChatSession } from '@/services/chatService';
import { useDocuments } from '@/hooks/use-documents';
import { useMessages } from '@/hooks/use-messages';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Initialize documents state with the useDocuments hook
  const {
    documents,
    setDocuments,
    handleDocumentUpload,
    handleRemoveDocument,
    handleUpdateDocumentInfluence,
    handleUpdateDocumentPoisoning,
    handleUpdateDocumentExclusion
  } = useDocuments();

  // Initialize messages state with the useMessages hook
  const {
    messages,
    isProcessing,
    handleSendMessage
  } = useMessages(chatSessionId, documents);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <MainLayout
          sidebar={
            <DocumentUpload 
              onDocumentUpload={handleDocumentUpload}
              documents={documents}
              onRemoveDocument={handleRemoveDocument}
              onUpdateDocumentInfluence={handleUpdateDocumentInfluence}
              onUpdateDocumentPoisoning={handleUpdateDocumentPoisoning}
              onUpdateDocumentExclusion={handleUpdateDocumentExclusion}
            />
          }
          content={
            <ChatInterface 
              messages={messages} 
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
            />
          }
        />
      </main>

      {/* Attribution footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-2 px-4 text-center text-xs text-gray-500">
        <p>
          AI Transparency Explorer | Developed as part of CMPT 415 directed studies under guidance of Dr. Nic Vincent and Dr. Margaret Grant at Simon Fraser University
        </p>
      </footer>
    </div>
  );
};

export default Index;
