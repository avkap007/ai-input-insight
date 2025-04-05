
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
                The influence slider value directly affects how much each document contributes to the AI's response.
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
                  <strong>API Interaction:</strong> The user's query along with the influence slider values for each document are sent to the Anthropic Claude API.
                </li>
                <li>
                  <strong>Response Generation:</strong> Claude generates a response based on the user's query and the weighted influence of each document.
                </li>
                <li>
                  <strong>Response Attribution:</strong> The system processes the response to determine which parts came from which documents.
                </li>
                <li>
                  <strong>Post-Generation Analysis:</strong> After generating the response, our system performs:
                  <ul className="list-disc pl-6">
                    <li>Sentiment Analysis using TextBlob and VADER</li>
                    <li>Bias Detection using specialized NLP algorithms</li>
                    <li>Trust Score Calculation based on source diversity and attribution confidence</li>
                  </ul>
                </li>
              </ol>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Technical Details</h3>
              <p>
                The influence slider's value is directly sent to the Anthropic API as part of the prompt. The API then processes the document content weighted by these influence values, generating a response that reflects the varying importance of each document.
              </p>
              
              <p className="mt-4">
                The system then analyzes the response text to determine which portions were likely influenced by which documents, creating a visual attribution map that helps users understand how different documents shaped the AI's response.
              </p>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
              <p className="font-medium">Current Research Implementation:</p>
              <p>
                This implementation demonstrates a direct approach to document influence through prompt engineering. The influence sliders and user's query are sent directly to the Anthropic API, which then generates responses that reflect the relative importance of each document.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
