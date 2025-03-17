
import React, { useState } from 'react';
import Header from '@/components/Header';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';
import { Document, Message } from '@/types';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDocumentUpload = (document: Document) => {
    setDocuments(prev => [...prev, document]);
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Document removed",
      description: "The document has been removed from your sources.",
    });
  };

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(content, documents),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 2000);
  };
  
  // Mock response generator
  const generateMockResponse = (query: string, docs: Document[]): string => {
    if (docs.length === 0) {
      return "I don't have any documents to reference. Please upload some documents so I can provide insights based on them.";
    }
    
    // Extract some content from the documents to make the response seem related
    const docSamples = docs.map(doc => {
      const snippet = doc.content.substring(0, 100).trim();
      return snippet + (doc.content.length > 100 ? '...' : '');
    });
    
    return `Based on the documents you've provided, I can tell you that ${docSamples[0]} Furthermore, ${docs.length > 1 ? docSamples[1] : 'there are additional insights to be found in your document.'}

This response is influenced by both your uploaded documents and my base knowledge. The visualization above shows which parts came from where.`;
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
