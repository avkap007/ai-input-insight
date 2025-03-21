
import React from 'react';
import Header from '@/components/Header';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
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
        
        <h1 className="text-3xl font-bold mb-8">About AI Transparency Explorer</h1>
        
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-8">
            This project was developed as part of a CMPT 415 directed studies course under the guidance of Dr. Nic Vincent and Dr. Margaret Grant at Simon Fraser University.
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Project Goals</h2>
            <p>
              AI Transparency Explorer aims to provide insights into how large language models process and combine information from various sources. Our key objectives include:
            </p>
            
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Visualizing how AI models attribute importance to different document sources</li>
              <li>Demonstrating how document influence weights affect AI-generated outputs</li>
              <li>Providing token-level attribution to show exactly which parts of the response come from which source</li>
              <li>Analyzing AI-generated text for sentiment, bias patterns, and trustworthiness</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <p>
              The AI Transparency Explorer combines several advanced techniques to provide meaningful insights:
            </p>
            
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Document Processing:</strong> Documents are uploaded, parsed, and indexed for efficient retrieval</li>
              <li><strong>Influence Weighting:</strong> Users can adjust how much each document influences the AI's response</li>
              <li><strong>Token Attribution:</strong> Each piece of text in the response is linked back to its most likely source (either a specific document or the AI's general knowledge)</li>
              <li><strong>Analysis Pipeline:</strong> Generated responses are analyzed for:
                <ul className="list-disc pl-6 mt-2">
                  <li>Sentiment indicators (positive, negative, or neutral tone)</li>
                  <li>Potential bias patterns across various dimensions</li>
                  <li>Trust scoring based on attribution confidence and source diversity</li>
                </ul>
              </li>
            </ul>
            
            <p className="mt-4">
              The visualization tools help you understand not just what the AI generates, but why and how it produced that content based on your provided documents.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Research Context</h2>
            <p>
              This project explores important research areas in AI:
            </p>
            
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Explainable AI (XAI):</strong> Making AI systems more transparent and interpretable</li>
              <li><strong>Attribution Analysis:</strong> Tracing AI outputs back to specific sources of information</li>
              <li><strong>Evaluation Metrics:</strong> Developing better ways to assess AI-generated content</li>
              <li><strong>User Experience:</strong> Creating intuitive interfaces for AI transparency tools</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Technical Implementation</h2>
            <p>
              The system is built using:
            </p>
            
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Frontend:</strong> React with TypeScript and Tailwind CSS</li>
              <li><strong>Backend:</strong> FastAPI (Python) with document processing libraries</li>
              <li><strong>Analysis:</strong> Custom NLP pipelines for attribution, sentiment, and bias analysis</li>
              <li><strong>Visualization:</strong> Recharts for data visualization and custom components for text highlighting</li>
            </ul>
            
            <p className="mt-4">
              The attribution system tracks how each token in the generated response relates to input documents, allowing for detailed analysis of how different sources influence the final output.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Acknowledgments</h2>
            <p>
              We would like to thank the School of Computing Science at Simon Fraser University for supporting this research project, and all the researchers whose work in AI transparency has informed and inspired this application.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;
