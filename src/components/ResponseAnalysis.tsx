
import React, { useState } from 'react';
import { AnalysisData } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from 'recharts';

interface ResponseAnalysisProps {
  analysisData: AnalysisData;
}

const ResponseAnalysis: React.FC<ResponseAnalysisProps> = ({ analysisData }) => {
  const { sentiment, bias, trustScore } = analysisData;
  const [expanded, setExpanded] = useState(false);
  
  // Convert sentiment from -1,1 to 0,100 for the progress bar
  const sentimentPercentage = Math.round((sentiment + 1) * 50);
  
  // Function to get color based on sentiment
  const getSentimentColor = () => {
    if (sentiment > 0.3) return 'bg-green-500';
    if (sentiment < -0.3) return 'bg-red-500';
    return 'bg-amber-500';
  };
  
  // Function to get sentiment label
  const getSentimentLabel = () => {
    if (sentiment > 0.5) return 'Very Positive';
    if (sentiment > 0.3) return 'Positive';
    if (sentiment > -0.3) return 'Neutral';
    if (sentiment > -0.5) return 'Negative';
    return 'Very Negative';
  };
  
  // Prepare bias data for chart
  const biasData = Object.entries(bias).map(([type, value]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: Math.round(value * 100)
  }));
  
  return (
    <div className="space-y-4 mt-4 w-full">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium flex items-center">
              Analysis Results
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={16} className="ml-2 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-2 max-w-xs">
                      <p className="text-xs font-medium">Response Analysis</p>
                      <p className="text-xs">
                        This analysis shows the sentiment, potential bias indicators, and trust metrics for the AI-generated response.
                      </p>
                      <p className="text-xs">
                        These metrics help you understand how the documents are influencing the AI's output.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sentiment Analysis */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500">Sentiment</span>
                      <Info size={12} className="ml-1 text-gray-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-2 max-w-xs">
                      <p className="text-xs font-medium">Sentiment Analysis</p>
                      <p className="text-xs">
                        Measures the emotional tone of the response from negative to positive. This can reveal how different document sources affect the emotional tone of AI-generated content.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-xs font-medium">{getSentimentLabel()}</span>
            </div>
            <div className="relative h-4 rounded-full bg-gray-100 overflow-hidden">
              <div 
                className={`absolute h-full ${getSentimentColor()}`}
                style={{ width: `${sentimentPercentage}%`, transition: 'width 0.5s ease-in-out' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-full bg-gray-300"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs mt-1 text-gray-500">
              <span>Negative</span>
              <span>Neutral</span>
              <span>Positive</span>
            </div>
          </div>
          
          {expanded && (
            <>
              {/* Bias Detection */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">Potential Bias Indicators</span>
                          <Info size={12} className="ml-1 text-gray-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-2 max-w-xs">
                          <p className="text-xs font-medium">Bias Detection</p>
                          <p className="text-xs">
                            Identifies potential biases in the AI's response across different categories.
                          </p>
                          <p className="text-xs">
                            Higher percentages indicate stronger presence of language associated with particular viewpoints or demographic considerations.
                          </p>
                          <p className="text-xs text-amber-600">
                            Note: This is a simplified indicator and not a comprehensive bias analysis.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={biasData}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 50, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {biasData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.value > 50 ? '#ef4444' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Trust Score */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">Trust Score</span>
                          <Info size={12} className="ml-1 text-gray-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-2 max-w-xs">
                          <p className="text-xs font-medium">Trust Score</p>
                          <p className="text-xs">
                            A composite metric based on:
                          </p>
                          <ul className="text-xs list-disc pl-4 space-y-1">
                            <li><strong>Source diversity</strong>: How many different sources influenced the response</li>
                            <li><strong>Attribution confidence</strong>: How confident the system is about the source attributions</li>
                            <li><strong>Base/document balance</strong>: Whether the response has a healthy mix of AI knowledge and document-sourced information</li>
                          </ul>
                          <p className="text-xs">
                            Higher scores suggest more reliable content with clearer attributions.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={Math.round(trustScore * 100)} className="h-2 flex-1" />
                  <span className="text-sm font-medium">{Math.round(trustScore * 100)}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Based on source diversity, confidence levels, and attribution balance
                </p>
              </div>
              
              {/* Technical explanation */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Technical Details</h4>
                <p className="text-xs text-gray-500 mb-2">
                  This analysis uses several NLP techniques to evaluate the generated content:
                </p>
                <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
                  <li><strong>Token Attribution:</strong> Maps output tokens to input sources using attention weights</li>
                  <li><strong>Sentiment Analysis:</strong> Lexicon-based approach with contextual adjustment</li>
                  <li><strong>Bias Detection:</strong> Word frequency analysis across semantic categories</li>
                  <li><strong>Trust Scoring:</strong> Weighted combination of attribution metrics</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponseAnalysis;
