
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
        
        <h1 className="text-3xl font-bold mb-8">How AI Transparency Works</h1>
        
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-8">
            This project was developed as part of a CMPT 415 directed studies course under the guidance of Dr. Nic Vincent and Dr. Margaret Grant at Simon Fraser University.
          </p>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">1. Token Attribution in Natural Language Processing (NLP)</h2>
            
            <div className="mb-6">
              <p className="mb-2"><strong>Definition:</strong> Token attribution refers to determining the contribution or importance of individual tokens (words or subwords) in a text input concerning the model's output.</p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Key Concepts:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Gradient-Based Methods:</strong> These techniques assess the sensitivity of the model's output to each input token by computing gradients. A significant gradient indicates a substantial influence of that token on the output.</li>
                <li><strong>Attention Mechanisms:</strong> In Transformer models, attention scores can serve as attribution indicators, highlighting which tokens the model focuses on during processing.</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Mathematical Perspective:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Integrated Gradients:</strong> This method computes the average gradient of the model's output concerning an input token, integrated over a path from a baseline (e.g., an all-zero input) to the actual input. The attribution for token x<sub>i</sub> is:
                  <div className="bg-gray-50 p-4 rounded-md my-4 overflow-x-auto">
                    <code>Attribution(x<sub>i</sub>) = (x<sub>i</sub> − x<sub>i</sub>′) × ∫<sub>α=0</sub><sup>1</sup> (∂F(x′ + α × (x − x′))/∂x<sub>i</sub>) dα</code>
                  </div>
                  <p>where x′ is the baseline input, x is the actual input, and F is the model's output function.</p>
                </li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Recommended Resources:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Research Paper:</strong> "Measuring Attribution in Natural Language Generation Models" provides a framework for evaluating attribution in NLP models. (direct.mit.edu)</li>
                <li><strong>Research Paper:</strong> "Locally Aggregated Feature Attribution on Natural Language Model Understanding" introduces a gradient-based feature attribution method for NLP models. (aclanthology.org)</li>
              </ul>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">2. Influence Weighting Mechanisms in AI Models</h2>
            
            <div className="mb-6">
              <p className="mb-2"><strong>Definition:</strong> Influence weighting mechanisms assign varying levels of importance to different input features or data samples, affecting the model's learning process and predictions.</p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Applications:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Feature Importance:</strong> Assigning weights to input features based on their relevance to the prediction task.</li>
                <li><strong>Sample Weighting:</strong> Giving different importance to training samples, which can be crucial in handling imbalanced datasets.</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Mathematical Perspective:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Weighted Loss Function:</strong> Incorporating weights into the loss function to prioritize certain features or samples. For instance, a weighted mean squared error loss is:
                  <div className="bg-gray-50 p-4 rounded-md my-4 overflow-x-auto">
                    <code>L = ∑<sub>i=1</sub><sup>n</sup> w<sub>i</sub> × (y<sub>i</sub> − ŷ<sub>i</sub>)<sup>2</sup></code>
                  </div>
                  <p>where w<sub>i</sub> is the weight for the i-th sample, y<sub>i</sub> is the true value, and ŷ<sub>i</sub> is the predicted value.</p>
                </li>
              </ul>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">3. Data Poisoning & Adversarial Attacks</h2>
            
            <div className="mb-6">
              <p className="mb-2"><strong>Definition:</strong> Data poisoning involves manipulating a model's training data to influence its behavior in specific ways, often with malicious intent.</p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Key Concepts:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Targeted Poisoning:</strong> Modifying data to cause misclassification of specific examples.</li>
                <li><strong>Backdoor Attacks:</strong> Inserting triggers into training data that cause predictable model behavior when present in test data.</li>
                <li><strong>Clean-Label Attacks:</strong> Poisoning that doesn't change the labels of training examples, making it harder to detect.</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Defense Mechanisms:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Robust Training:</strong> Using methods like adversarial training to make models resilient to poisoned data.</li>
                <li><strong>Data Sanitization:</strong> Filtering out potentially poisoned samples before training.</li>
                <li><strong>Anomaly Detection:</strong> Identifying and removing outliers that may represent poisoned examples.</li>
              </ul>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">4. Our Implementation</h2>
            
            <div className="mb-6">
              <p>This application demonstrates these concepts by:</p>
              
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Allowing users to upload documents with adjustable influence scores</li>
                <li>Simulating data poisoning to observe its effects on model outputs</li>
                <li>Visualizing token attribution to see which parts of the response come from which source</li>
                <li>Providing detailed attribution charts showing the contribution of each document</li>
                <li>Offering sentiment and bias analysis of the generated content</li>
              </ul>
              
              <p className="mt-4">
                By experimenting with different influence levels and data poisoning settings, users can gain insights into how AI models combine information from various sources and how they might be vulnerable to manipulation.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
