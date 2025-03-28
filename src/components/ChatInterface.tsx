
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import InfluenceVisualization from './InfluenceVisualization';
import AttributionChart from './AttributionChart';
import ResponseAnalysis from './ResponseAnalysis';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage,
  isProcessing
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto elegant-scrollbar pb-4">
        <div className="space-y-6 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-4">
                <h2 className="text-xl font-medium mb-2">AI Transparency Explorer</h2>
                <p className="text-gray-500 mb-4">
                  Upload documents to see how they influence AI-generated responses. Try uploading creative writing samples or academic texts.
                </p>
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600">Try asking:</p>
                  <ul className="text-sm mt-2 space-y-2">
                    <li className="p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors" 
                        onClick={() => onSendMessage("Write me a short story about a 7-year-old boy going on an after-school adventure")}>
                      "Write me a short story about a 7-year-old boy going on an after-school adventure"
                    </li>
                    <li className="p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => onSendMessage("Explain the importance of climate change using the style of my documents")}>
                      "Explain the importance of climate change using the style of my documents"
                    </li>
                    <li className="p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => onSendMessage("Create a poem about friendship inspired by my documents")}>
                      "Create a poem about friendship inspired by my documents"
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={cn(
                  "w-full max-w-full sm:max-w-[90%] md:max-w-3xl",
                  message.role === 'user' ? 'ml-auto' : 'mr-auto'
                )}
              >
                <div className={cn(
                  "rounded-2xl p-4",
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gray-100 text-gray-800'
                )}>
                  {message.role === 'user' ? (
                    <p>{message.content}</p>
                  ) : (
                    <div className="space-y-4">
                      <InfluenceVisualization 
                        message={message.content} 
                        attributions={message.attributions || []} 
                      />
                      {message.attributionData && (
                        <AttributionChart data={message.attributionData} />
                      )}
                      {message.analysisData && (
                        <ResponseAnalysis analysisData={message.analysisData} />
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-400 px-2">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className={cn(
              "w-full max-w-full sm:max-w-[90%] md:max-w-3xl",
              "mr-auto"
            )}>
              <div className="bg-gray-100 text-gray-800 rounded-2xl p-6">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse"></div>
                  <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-400 px-2">
                Processing your request...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="border-t border-gray-100 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or request content based on your documents..."
            className="flex-1 input-field px-4 py-2 border border-gray-300 rounded-lg"
            disabled={isProcessing}
          />
          <button 
            type="submit" 
            className={cn(
              "btn-primary bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center justify-center",
              isProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
            )}
            disabled={isProcessing}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
