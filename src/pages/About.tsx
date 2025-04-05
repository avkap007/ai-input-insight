
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

        <h1 className="text-3xl font-bold mb-8">About AI Input Insight</h1>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Current Implementation</h2>
            
            <p className="text-gray-600 mb-4">
              AI Input Insight is a research-driven tool designed to explore how document inputs influence large language model responses. 
              Our current implementation leverages the Anthropic Claude API to demonstrate document-level attribution and context manipulation.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Key Features</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Weighted Document Influence:</strong> Users can adjust the influence of each uploaded document using intuitive sliders.
              </li>
              <li>
                <strong>Direct API Integration:</strong> Document influence scores are directly incorporated into the prompt sent to the Anthropic Claude API.
              </li>
              <li>
                <strong>Response Analysis:</strong> Automatic sentiment analysis using TextBlob and VADER, bias detection, and trust score calculations for generated responses.
              </li>
              <li>
                <strong>Multi-Format Support:</strong> Upload and process PDFs and text documents.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Technical Approach</h3>
            <p>
              When generating a response, our system sends a comprehensive prompt to Claude that includes:
              <ul className="list-disc pl-6 mt-2">
                <li>User's query</li>
                <li>Document influence values as set by the user with the sliders</li>
                <li>Document contents weighted according to their influence values</li>
              </ul>
            </p>
            <p className="mt-4">
              This approach allows for direct exploration of how document influence values affect an AI's response, with visualization tools to help understand which parts of the response were derived from which sources.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Technical Architecture</h2>
            <p className="mb-4">
              AI Input Insight is built with a modern tech stack:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Frontend:</strong> React, TypeScript, Tailwind CSS, shadcn/ui components</li>
              <li><strong>Backend:</strong> FastAPI (Python), SQLite database with SQLAlchemy</li>
              <li><strong>AI Integration:</strong> Anthropic Claude API for response generation</li>
              <li><strong>Analysis Tools:</strong> TextBlob, VADER, and custom NLP algorithms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Research and Educational Value</h2>
            <p>
              Developed as part of a directed studies course at Simon Fraser University under the guidance of Dr. Nic Vincent and Dr. Margaret Grant, 
              this tool serves both as a research prototype and an educational platform for understanding AI context manipulation.
            </p>
          </section>

          <section className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
            <p className="font-medium">Research Note:</p>
            <p>
              The current implementation demonstrates how document influence can be directly integrated into AI response generation through prompt engineering. 
              Future work may explore more sophisticated attribution and context modeling techniques.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;
