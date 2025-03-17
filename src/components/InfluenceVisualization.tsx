
import React, { useMemo } from 'react';
import { TokenAttribution } from '@/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InfluenceVisualizationProps {
  message: string;
  attributions: TokenAttribution[];
}

const InfluenceVisualization: React.FC<InfluenceVisualizationProps> = ({ 
  message,
  attributions 
}) => {
  // If we don't have attributions yet, show the raw message
  if (!attributions.length) {
    return <p className="text-gray-700 leading-relaxed">{message}</p>;
  }

  return (
    <div className="text-gray-700 leading-relaxed">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-200"></div>
          <span className="text-xs text-gray-500">AI base knowledge</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-200"></div>
          <span className="text-xs text-gray-500">Document influenced</span>
        </div>
      </div>
      
      <div>
        {attributions.map((token, index) => (
          <TooltipProvider key={index}>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <span 
                  className={cn(
                    "inline px-0.5 py-0.5 rounded-sm transition-colors",
                    token.source === 'base' ? 'highlight-base' : 'highlight-document'
                  )}
                >
                  {token.text}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {token.source === 'base' 
                  ? `Based on AI's training data (${Math.round(token.confidence * 100)}% confidence)`
                  : `From document source (${Math.round(token.confidence * 100)}% confidence)`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

export default InfluenceVisualization;
