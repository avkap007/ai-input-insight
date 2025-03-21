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
          <p className="text-gray-600 mb-8">
            This project was developed as part of a CMPT 415 directed studies course under the guidance of Dr. Nic Vincent and Dr. Margaret Grant at Simon Fraser University.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Project Goals</h2>
            <p>
              AI Input Insight is a tool designed to help users explore how document inputs influence the behavior of large language models (LLMs). Our key objectives include:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Visualizing how uploaded content changes AI responses</li>
              <li>Understanding document-level influence with sliders</li>
              <li>Highlighting token attribution to specific documents</li>
              <li>Running post-generation analysis (sentiment, bias, trust)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Design Philosophy</h2>
            <p>
              Our goal was to demystify the "black box" nature of LLMs. We allow you to upload text or PDFs and tweak how much each one matters. Once the AI responds, you can see which source contributed to which part of the answer.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Minimal, modular UI:</strong> Designed for ease and clarity</li>
              <li><strong>Research-oriented controls:</strong> Supports exclusion, poisoning, influence</li>
              <li><strong>Transparency overlays:</strong> Every response is annotated and analyzed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Tech Stack</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Frontend:</strong> React + Tailwind + shadcn/ui</li>
              <li><strong>Backend:</strong> FastAPI</li>
              <li><strong>NLP:</strong> NLTK, VADER, TextBlob, Biaslyze (WIP)</li>
              <li><strong>Deployment:</strong> Local for now, working on Render/Vercel next</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Acknowledgments</h2>
            <p>
              Special thanks to the School of Computing Science at SFU, and to the growing community of researchers and engineers advancing the field of AI transparency.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;
