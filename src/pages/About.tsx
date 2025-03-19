
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
        
        <h1 className="text-3xl font-bold mb-8">About AI Transparency</h1>
        
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-8">
            This project was developed as part of a CMPT 415 directed studies course under the guidance of Dr. Nic Vincent and Dr. Margaret Grant at Simon Fraser University.
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Project Goals</h2>
            <p>
              AI Transparency Explorer aims to demystify how large language models process and combine information from various sources. Our key objectives include:
            </p>
            
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Visualizing how AI models attribute importance to different sources</li>
              <li>Demonstrating the impact of data poisoning on AI outputs</li>
              <li>Exploring the ethical implications of influence weighting in AI systems</li>
              <li>Providing educational tools to help understand AI transparency concepts</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Research Context</h2>
            <p>
              This project sits at the intersection of several important research areas in AI:
            </p>
            
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Explainable AI (XAI):</strong> Making AI systems more transparent and interpretable</li>
              <li><strong>AI Safety:</strong> Understanding vulnerabilities in AI systems</li>
              <li><strong>Natural Language Processing:</strong> Exploring how language models process and generate text</li>
              <li><strong>Data Ethics:</strong> Investigating the ethical implications of data usage in AI</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Team</h2>
            <p>
              This project was developed by students in the School of Computing Science at Simon Fraser University, under faculty supervision.
            </p>
            
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">Faculty Advisors</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Dr. Nic Vincent - Assistant Professor, School of Computing Science</li>
                <li>Dr. Margaret Grant - Associate Professor, School of Computing Science</li>
              </ul>
            </div>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Technologies Used</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>React and TypeScript for the frontend application</li>
              <li>Tailwind CSS for styling</li>
              <li>Supabase for backend functionality</li>
              <li>Claude API for AI response generation (where available)</li>
            </ul>
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
