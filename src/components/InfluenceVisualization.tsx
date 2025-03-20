
import React, { useState } from 'react';
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
  const [highlightMode, setHighlightMode] = useState<'all' | 'document' | 'base'>('all');

  // If we don't have attributions yet, show the raw message
  if (!attributions || !attributions.length) {
    return <p className="text-gray-700 leading-relaxed whitespace-pre-line">{message}</p>;
  }

  const toggleHighlightMode = (mode: 'all' | 'document' | 'base') => {
    setHighlightMode(mode);
  };

  // Find a document name from its ID (used in tooltip)
  const getDocumentName = (documentId: string): string => {
    // This is a placeholder - in a real app, you would probably have a way to get 
    // the document name from its ID via a context or other mechanism
    const docIdPrefix = documentId.substring(0, 8);
    return `Document ${docIdPrefix}...`; // Just showing first 8 chars of ID for now
  };

  return (
    <div className="text-gray-700 leading-relaxed">
      <div className="mb-3 flex flex-col">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <button 
            onClick={() => toggleHighlightMode('all')}
            className={cn(
              "text-xs py-1 px-2 rounded-full transition-colors",
              highlightMode === 'all' ? "bg-gray-200 text-gray-800" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            Show All Sources
          </button>
          <button 
            onClick={() => toggleHighlightMode('base')}
            className={cn(
              "text-xs py-1 px-2 rounded-full transition-colors flex items-center gap-1",
              highlightMode === 'base' ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            <div className="w-2 h-2 rounded-sm bg-blue-100 border border-blue-200"></div>
            AI Base Knowledge
          </button>
          <button 
            onClick={() => toggleHighlightMode('document')}
            className={cn(
              "text-xs py-1 px-2 rounded-full transition-colors flex items-center gap-1",
              highlightMode === 'document' ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            <div className="w-2 h-2 rounded-sm bg-amber-100 border border-amber-200"></div>
            Document Influenced
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Click on any highlighted text to see its attribution details
        </p>
      </div>
      
      <div className="whitespace-pre-line">
        {attributions.map((attribution, index) => {
          // Skip rendering if it doesn't match the current highlight mode
          if (highlightMode !== 'all' && attribution.source !== highlightMode) {
            return <span key={index}>{attribution.text}</span>;
          }
          
          return (
            <TooltipProvider key={index}>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <span 
                    className={cn(
                      "inline transition-colors cursor-pointer",
                      attribution.source === 'base' 
                        ? 'highlight-base bg-blue-50 hover:bg-blue-100' 
                        : 'highlight-document bg-amber-50 hover:bg-amber-100'
                    )}
                  >
                    {attribution.text}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="px-3 py-2 bg-white">
                  {attribution.source === 'base' 
                    ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">AI Base Knowledge</p>
                        <p className="text-xs text-gray-500">
                          This content comes from the AI's general training, not from your specific documents.
                        </p>
                        <p className="text-xs text-blue-600">Confidence: {Math.round(attribution.confidence * 100)}%</p>
                      </div>
                    )
                    : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Document Influenced</p>
                        <p className="text-xs text-gray-500">
                          This content is influenced by your uploaded document: {
                            attribution.documentId ? getDocumentName(attribution.documentId) : "Unknown"
                          }
                        </p>
                        <p className="text-xs text-amber-600">Confidence: {Math.round(attribution.confidence * 100)}%</p>
                      </div>
                    )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

export default InfluenceVisualization;
