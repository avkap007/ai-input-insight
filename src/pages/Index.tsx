import React, { useState } from 'react';
import Header from '@/components/Header';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from '@/components/ui/use-toast';
import { useDocuments } from '@/hooks/use-documents';
import { useMessages } from '@/hooks/use-messages';
import { Document } from '@/types';

const Index = () => {
  // Initialize documents state with the useDocuments hook
  const {
    documents,
    isLoading,
    handleDocumentUpload,
    handleAddTextDocument,
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
  } = useMessages();

  // Wrapper that passes File to the hook's handleDocumentUpload
  const handleDocUpload = async (file: File) => {
    try {
      // Call the hook's method which handles API call and state management
      return await handleDocumentUpload(file);
    } catch (error) {
      console.error("Error handling document upload:", error);
      toast({
        title: "Upload failed",
        description: "There was an error processing your document.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Create a wrapper function to handle sending messages with documents
  const handleSendMessageWithDocs = (content: string) => {
    return handleSendMessage(content, documents);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <MainLayout
          sidebar={
            <DocumentUpload 
              onDocumentUpload={handleDocUpload}
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
              onSendMessage={handleSendMessageWithDocs}
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
