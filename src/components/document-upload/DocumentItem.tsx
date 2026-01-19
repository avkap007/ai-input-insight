
import React from 'react';
import { X, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Document } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DocumentItemProps {
  document: Document;
  onRemove: (id: string) => void;
  onInfluenceChange: (id: string, value: number) => void;
  onPoisoningChange?: (id: string, value: number) => void;
  onExclusionChange?: (id: string, value: boolean) => void;
  showAdvancedControls?: boolean;
}

const DocumentItem: React.FC<DocumentItemProps> = ({
  document,
  onRemove,
  onInfluenceChange,
  onPoisoningChange,
  onExclusionChange,
  showAdvancedControls = false
}) => {
  const { id, name, type, size, influenceScore = 0.5, poisoningLevel = 0, excluded = false } = document;

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb * 10) / 10} KB`;
    const mb = kb / 1024;
    return `${Math.round(mb * 10) / 10} MB`;
  };

  // Get influence level description
  const getInfluenceDescription = (score: number): string => {
    if (score >= 0.9) return "Maximum - AI writes exactly like this document";
    if (score >= 0.7) return "High - AI heavily mimics this style";
    if (score >= 0.5) return "Medium - AI blends this style with neutral";
    if (score >= 0.3) return "Low - AI slightly hints at this style";
    return "Minimal - Almost no influence on AI output";
  };

  // Get poisoning level description
  const getPoisoningDescription = (level: number): string => {
    if (level >= 0.6) return "Severe - Data heavily corrupted, unreliable output";
    if (level >= 0.3) return "Medium - Conflicting information inserted";
    return "Light - Minor errors introduced";
  };

  // Truncate long filenames for display
  const displayName = name.length > 20 ? name.substring(0, 18) + '...' : name;

  return (
    <TooltipProvider>
      <div className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-sm p-3 transition-all flex flex-col gap-2",
        excluded ? "opacity-50" : ""
      )}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-semibold">
              {type === 'pdf' ? 'PDF' : 'TXT'}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate" title={name}>{displayName}</div>
            {size && <div className="text-xs text-gray-500 mt-0.5">{formatSize(size)}</div>}
          </div>
          <button
            onClick={() => onRemove(id)}
            className="text-gray-400 hover:text-gray-600 transition-colors self-start ml-auto flex-shrink-0"
            aria-label="Remove document"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <label htmlFor={`influence-${id}`} className="text-xs font-medium text-gray-700">
              Influence: {Math.round(influenceScore * 100)}%
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle size={12} className="text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Document Influence</p>
                <p className="text-xs">Controls how much this document's writing style affects AI responses. Higher = AI mimics this document's vocabulary, tone, and structure more closely.</p>
                <p className="text-xs mt-1 text-gray-500">{getInfluenceDescription(influenceScore)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <input
            id={`influence-${id}`}
            type="range"
            min="0"
            max="100"
            value={Math.round(influenceScore * 100)}
            onChange={(e) => onInfluenceChange(id, parseInt(e.target.value) / 100)}
            className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-blue-600"
          />
        </div>

        {showAdvancedControls && (
          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100">
            {onPoisoningChange && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <label htmlFor={`poisoning-${id}`} className="text-xs font-medium text-gray-700">
                    Data Poisoning: {Math.round(poisoningLevel * 100)}%
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle size={12} className="text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Data Poisoning</p>
                      <p className="text-xs">Simulates corrupted or unreliable training data. Shows how bad data quality leads to confused, contradictory, or unreliable AI outputs.</p>
                      <p className="text-xs mt-1 text-gray-500">{poisoningLevel > 0 ? getPoisoningDescription(poisoningLevel) : "No poisoning applied"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <input
                  id={`poisoning-${id}`}
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(poisoningLevel * 100)}
                  onChange={(e) => onPoisoningChange(id, parseInt(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-red-600"
                />
              </div>
            )}

            {onExclusionChange && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <label htmlFor={`exclude-${id}`} className="text-xs font-medium text-gray-700">
                    Exclude from context
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle size={12} className="text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Document Exclusion</p>
                      <p className="text-xs">Completely removes this document from the AI's context. Simulates a "data strike" where content creators withdraw their data from AI training.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <input
                  id={`exclude-${id}`}
                  type="checkbox"
                  checked={excluded}
                  onChange={(e) => onExclusionChange(id, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default DocumentItem;
