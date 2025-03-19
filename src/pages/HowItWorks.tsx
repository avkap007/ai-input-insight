
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
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Implementation in Our Application:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>InfluenceVisualization Component:</strong> We implement token highlighting using the <code>InfluenceVisualization.tsx</code> component, which maps tokens to their sources.</li>
                <li><strong>Attribution Data Structure:</strong> We use a specialized data structure (<code>TokenAttribution</code> type in <code>src/types/index.ts</code>) to track the source and confidence of each token.</li>
                <li><strong>Backend Processing:</strong> Our Supabase edge function (<code>supabase/functions/generate-response/index.ts</code>) performs the attribution calculations, assigning tokens to either base knowledge or specific document sources.</li>
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
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Implementation in Our Application:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Document Influence Sliders:</strong> We allow users to adjust influence scores through interactive sliders in the <code>DocumentItem.tsx</code> component.</li>
                <li><strong>Normalization Algorithm:</strong> In our edge function, we normalize these influence scores to determine the weighted contribution of each document via the <code>normalizedInfluence</code> calculation.</li>
                <li><strong>Visualization:</strong> The <code>AttributionChart.tsx</code> component visualizes these weights as contribution percentages in a chart.</li>
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
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Implementation in Our Application:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Poisoning Controls:</strong> We implement poisoning level controls in <code>DocumentItem.tsx</code> that allow users to simulate different levels of data manipulation.</li>
                <li><strong>Simulation Function:</strong> The <code>simulateDataPoisoning()</code> function in <code>utils/contentAnalysis.ts</code> applies modifications to document content based on the poisoning level.</li>
                <li><strong>Response Flagging:</strong> Our system automatically flags responses that were influenced by poisoned data, allowing users to observe the effects.</li>
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
            <h2 className="text-2xl font-bold mb-4">4. Response Analysis & Visualization</h2>
            
            <div className="mb-6">
              <p className="mb-2"><strong>Definition:</strong> Techniques to analyze and visualize AI-generated responses, focusing on sentiment, bias, and trust indicators.</p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Key Components:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Sentiment Analysis:</strong> Our application uses lexicon-based sentiment analysis implemented in <code>utils/contentAnalysis.ts</code> through the <code>analyzeSentiment()</code> function, which assigns a score from -1 (negative) to 1 (positive).</li>
                <li><strong>Bias Detection:</strong> The <code>detectBias()</code> function identifies potential biases across categories by analyzing word frequency and context patterns.</li>
                <li><strong>Trust Scoring:</strong> We calculate a composite trust score using the <code>calculateTrustScore()</code> function, which considers source diversity, attribution confidence, and the balance of base knowledge vs. document contributions.</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Visualization Techniques:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Interactive Highlighting:</strong> The <code>InfluenceVisualization</code> component implements hover-based highlighting to show token sources.</li>
                <li><strong>Charts and Graphs:</strong> We use <code>recharts</code> in the <code>AttributionChart</code> and <code>ResponseAnalysis</code> components to visualize contribution percentages, sentiment trends, and bias indicators.</li>
                <li><strong>Progress Indicators:</strong> Trust scores and sentiment values are displayed using interactive progress bars with color-coding to indicate significance.</li>
              </ul>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. Technical Architecture</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mt-6 mb-3">Frontend Components:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Document Management:</strong> <code>DocumentUpload.tsx</code>, <code>DocumentItem.tsx</code>, and associated components handle file uploads and document controls.</li>
                <li><strong>Chat Interface:</strong> <code>ChatInterface.tsx</code> manages user queries and displays AI responses.</li>
                <li><strong>Visualizations:</strong> <code>InfluenceVisualization.tsx</code>, <code>AttributionChart.tsx</code>, and <code>ResponseAnalysis.tsx</code> provide interactive visualizations of AI behavior.</li>
                <li><strong>Layout:</strong> <code>MainLayout.tsx</code> handles the application's responsive layout structure.</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Backend Services:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Data Storage:</strong> Supabase PostgreSQL database stores chat sessions, messages, documents, and attribution data for analysis.</li>
                <li><strong>Edge Functions:</strong> <code>generate-response</code> function processes user queries with document context and produces attributed responses.</li>
                <li><strong>Authentication:</strong> Supabase authentication service handles user sessions (though currently not implemented in the demo).</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Data Flow Architecture:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>User Query Lifecycle:</strong>
                  <ol className="list-decimal pl-6 mt-2">
                    <li>User submits a query through <code>ChatInterface</code></li>
                    <li>Query is processed by <code>handleSendMessage</code> in <code>use-messages.tsx</code></li>
                    <li>Message and document data are sent to the <code>generate-response</code> edge function</li>
                    <li>Edge function processes the query, considering document influence and poisoning</li>
                    <li>Response with attribution data is returned and displayed</li>
                    <li>All data is saved to Supabase for later analysis</li>
                  </ol>
                </li>
                <li><strong>Document Processing:</strong>
                  <ol className="list-decimal pl-6 mt-2">
                    <li>User uploads a document through <code>DocumentUpload</code></li>
                    <li>Files are processed by <code>fileProcessing.ts</code> utilities</li>
                    <li>Documents are stored in application state via <code>use-documents.tsx</code></li>
                    <li>User can adjust influence, poisoning level, and exclusion settings</li>
                  </ol>
                </li>
              </ul>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">6. Data Storage & Analysis</h2>
            
            <div className="mb-6">
              <p className="mb-2"><strong>Database Schema:</strong> Our application uses the following Supabase tables to persist data for analysis:</p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>chat_sessions:</strong> Stores information about each chat session</li>
                <li><strong>messages:</strong> Stores all user queries and AI responses</li>
                <li><strong>documents:</strong> Stores uploaded documents with metadata</li>
                <li><strong>token_attributions:</strong> Stores token-level attribution data</li>
                <li><strong>attribution_data:</strong> Stores aggregate attribution metrics</li>
              </ul>
              
              <p className="mt-4 mb-2"><strong>Analysis Workflow:</strong> You can retrieve stored interactions for analysis via:</p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Direct Database Access:</strong> Query the Supabase database tables using SQL to extract specific patterns or trends</li>
                <li><strong>Session Replays:</strong> While not currently implemented, the stored data could support a feature to "replay" previous sessions</li>
                <li><strong>Export Functionality:</strong> A future enhancement could include exporting data in formats suitable for external analysis (CSV, JSON)</li>
              </ul>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
                <p className="font-medium">Research Note:</p>
                <p>All interactions in this application are saved to the Supabase database, making it ideal for conducting mock studies. You can collect multiple interaction examples and then analyze them for patterns in how different document attributes (influence, poisoning) affect the AI's responses over time.</p>
              </div>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">7. Our Implementation</h2>
            
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
              
              <div className="bg-gray-50 p-4 rounded-md mt-6 border border-gray-200">
                <h4 className="font-medium mb-2">Tech Stack:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Frontend:</strong> React, TypeScript, Tailwind CSS, shadcn/ui components</li>
                  <li><strong>Visualization:</strong> Recharts for data visualization</li>
                  <li><strong>Backend:</strong> Supabase for database and serverless edge functions</li>
                  <li><strong>AI Integration:</strong> Anthropic Claude API (optional)</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
