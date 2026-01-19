
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
            <h2 className="text-2xl font-bold mb-4">What is this tool?</h2>
            
            <p className="text-gray-600 mb-4">
              AI Input Insight is an <strong>educational demonstration tool</strong> that shows how documents influence AI-generated responses. 
              It helps students and researchers understand the relationship between training data and AI outputs.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Key Concepts Demonstrated</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Data Influence:</strong> How the style, tone, and content of input documents shape AI responses
              </li>
              <li>
                <strong>Data Quality:</strong> How corrupted or unreliable data leads to confused or misleading AI outputs
              </li>
              <li>
                <strong>Data Leverage:</strong> How content creators can influence (or withdraw influence from) AI systems
              </li>
              <li>
                <strong>AI Transparency:</strong> Why it matters to understand where AI responses come from
              </li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Features</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Document Upload:</strong> Upload text files to serve as style/content sources
              </li>
              <li>
                <strong>Influence Slider:</strong> Control how much each document affects AI writing style (0-100%)
              </li>
              <li>
                <strong>Data Poisoning:</strong> Simulate corrupted training data to see its effects
              </li>
              <li>
                <strong>Document Exclusion:</strong> Remove documents entirely to simulate "data strikes"
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Technical Architecture</h2>
            <p className="mb-4">
              Built with modern web technologies:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Frontend:</strong> React, TypeScript, Tailwind CSS, shadcn/ui</li>
              <li><strong>Backend:</strong> Flask (Python) deployed on Vercel</li>
              <li><strong>AI:</strong> Anthropic Claude API (Haiku model for fast responses)</li>
              <li><strong>Hosting:</strong> Vercel (frontend + serverless functions)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Research Context</h2>
            <p>
              Developed as part of CMPT 415 directed studies at Simon Fraser University under the guidance of 
              Dr. Nic Vincent and Dr. Margaret Grant. This tool serves as both a research prototype and an 
              educational platform for understanding AI transparency and data ethics.
            </p>
          </section>

          <section className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
            <p className="font-medium">Why This Matters:</p>
            <p>
              As AI systems become more prevalent, understanding how they work is crucial. This tool helps 
              demonstrate that AI outputs are not neutral - they're shaped by their input data. This has 
              implications for content creators, researchers, and anyone who uses AI-generated content.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;
