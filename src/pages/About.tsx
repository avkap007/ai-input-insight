
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
              <li>Understanding document-level influence with adjustable sliders</li>
              <li>Highlighting document attribution in generated responses</li>
              <li>Performing post-generation analysis (sentiment, bias, trust)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <p>
              Our system allows you to upload text or PDFs and adjust how much each document matters when generating responses. The backend processes your documents and uses the Anthropic Claude API to generate responses based on your query and the uploaded documents.
            </p>
            <p className="mt-4">
              After generating a response, we analyze it using several NLP techniques:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Sentiment analysis:</strong> Using TextBlob to assess the emotional tone</li>
              <li><strong>Bias detection:</strong> Identifying potential biases in the generated text</li>
              <li><strong>Trust scoring:</strong> Calculating how much the response can be trusted based on document influence</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Tech Stack</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Frontend:</strong> React + TypeScript, Tailwind CSS, shadcn/ui</li>
              <li><strong>Backend:</strong> FastAPI (Python), SQLite database</li>
              <li><strong>NLP:</strong> TextBlob, VADER, HateSonar</li>
              <li><strong>AI:</strong> Anthropic Claude API</li>
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
