
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
            <h2 className="text-2xl font-bold mb-4">Document Influence & Style Transfer</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mt-6 mb-3">The Core Concept</h3>
              <p>
                AI Input Insight demonstrates how documents influence AI-generated responses through <strong>style transfer</strong>. 
                When you upload a document and adjust its influence slider, the AI adapts its writing style to match that document's 
                vocabulary, tone, and structure.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">How Influence Levels Work</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Level</th>
                      <th className="text-left py-2">Effect on AI Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-medium">90-100%</td>
                      <td className="py-2">AI writes exactly like the document's author - same vocabulary, tone, and style</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">70-89%</td>
                      <td className="py-2">AI heavily mimics the style - clearly noticeable influence</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">50-69%</td>
                      <td className="py-2">AI blends the style with neutral baseline</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">30-49%</td>
                      <td className="py-2">AI lightly hints at the style - subtle influence</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">0-29%</td>
                      <td className="py-2">AI almost ignores the document - neutral response</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">The Process</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Upload a Document:</strong> You upload a text file containing any writing style (dystopian fiction, children's story, academic paper, etc.)
                </li>
                <li>
                  <strong>Set Influence Level:</strong> Adjust the slider to control how much the document affects AI responses (0-100%)
                </li>
                <li>
                  <strong>Ask a Question:</strong> Type a request like "Write a story about a child going shopping"
                </li>
                <li>
                  <strong>See the Difference:</strong> The AI generates a response styled according to your document's influence level
                </li>
              </ol>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Advanced Features</h3>
              
              <h4 className="text-lg font-medium mt-4 mb-2">Data Poisoning</h4>
              <p>
                Simulates what happens when AI is trained on corrupted or unreliable data:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Light (0-30%):</strong> Minor word substitutions that flip meanings (good→bad, happy→sad)</li>
                <li><strong>Medium (30-60%):</strong> Contradictory statements inserted into the document</li>
                <li><strong>Heavy (60-100%):</strong> Severe corruption with shuffled content and unreliability warnings</li>
              </ul>
              
              <h4 className="text-lg font-medium mt-4 mb-2">Document Exclusion</h4>
              <p>
                Completely removes a document from the AI's context. This demonstrates "data strikes" - 
                what happens when content creators withdraw their data from AI training.
              </p>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
              <p className="font-medium">Educational Purpose:</p>
              <p>
                This tool helps you understand that AI responses are shaped by their input data. 
                By experimenting with different documents and settings, you can see firsthand how 
                data influences AI outputs - a key concept in AI transparency and data ethics.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
