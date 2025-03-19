
import React from 'react';
import { AnalysisData } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from 'recharts';

interface ResponseAnalysisProps {
  analysisData: AnalysisData;
}

const ResponseAnalysis: React.FC<ResponseAnalysisProps> = ({ analysisData }) => {
  const { sentiment, bias, trustScore } = analysisData;
  
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
          <CardTitle className="text-sm font-medium flex items-center">
            Analysis Results
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={16} className="ml-2 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    This analysis shows the sentiment, bias, and trust metrics for the AI-generated response.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sentiment Analysis */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Sentiment</span>
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
          
          {/* Bias Detection */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Potential Bias Indicators</span>
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
              <span className="text-xs text-gray-500">Trust Score</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={14} className="text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Trust score is calculated based on source diversity, confidence levels, and base knowledge proportion.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={Math.round(trustScore * 100)} className="h-2" />
              <span className="text-sm font-medium">{Math.round(trustScore * 100)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponseAnalysis;
