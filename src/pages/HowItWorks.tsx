
import React from 'react';
import Header from '@/components/Header';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const HowItWorks: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link to="/" className="flex items-center text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={16} className="mr-1" />
            <span className="text-sm">Back to app</span>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-8">How AI Input Insight Works</h1>
        
        <div className="prose max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Current Implementation: Document Influence and AI Response Generation</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mt-6 mb-3">Document Influence Mechanism</h3>
              <p>
                In our current implementation, users can upload documents (PDFs or text files) and adjust their influence using a slider for each document. 
                The influence slider determines how much each document contributes to the context when generating an AI response.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">AI Response Generation Process</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Document Preparation:</strong> When a user uploads documents, each document is processed and stored with its content and an initial influence score.
                </li>
                <li>
                  <strong>Influence Adjustment:</strong> Users can manually adjust the influence slider for each document, which ranges from 0 to 1 (0% to 100% influence).
                </li>
                <li>
                  <strong>Context Compilation:</strong> When a query is submitted, the system compiles context by:
                  <ul className="list-disc pl-6">
                    <li>Selecting documents not marked as excluded</li>
                    <li>Weighting document texts proportionally to their influence scores</li>
                    <li>Preserving the original text of each document</li>
                  </ul>
                </li>
                <li>
                  <strong>API Interaction:</strong> The compiled context, along with the user's query, is sent to the Anthropic Claude API as a single, comprehensive prompt.
                </li>
                <li>
                  <strong>Response Generation:</strong> Claude generates a response considering the weighted document contexts and the original query.
                </li>
                <li>
                  <strong>Post-Generation Analysis:</strong> After generating the response, our system performs:
                  <ul className="list-disc pl-6">
                    <li>Sentiment Analysis</li>
                    <li>Bias Detection</li>
                    <li>Trust Score Calculation</li>
                  </ul>
                </li>
              </ol>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Technical Details</h3>
              <p>
                The influence slider's value is directly sent to the Anthropic API as part of the prompt engineering process. This allows fine-grained control over how much each document contributes to the context and ultimately shapes the AI's response.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
