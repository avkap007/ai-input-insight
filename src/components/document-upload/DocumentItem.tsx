
import React from 'react';
import { File, FileText, X, AlertTriangle, InfoIcon } from 'lucide-react';
import { Document } from '@/types';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const handleInfluenceChange = (value: number[]) => {
    onInfluenceChange(document.id, value[0]);
  };

  const handlePoisoningChange = (value: number[]) => {
    if (onPoisoningChange) {
      onPoisoningChange(document.id, value[0]);
    }
  };

  const handleExclusionChange = (checked: boolean) => {
    if (onExclusionChange) {
      onExclusionChange(document.id, checked);
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${document.excluded ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'} flex flex-col gap-2 group animate-scale-in`}>
      <div className="flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="shrink-0">
            {document.type === 'pdf' ? (
              <File size={16} className="text-red-500" />
            ) : (
              <FileText size={16} className="text-blue-500" />
            )}
            {document.poisoningLevel > 0 && (
              <AlertTriangle size={14} className="text-amber-500 mt-1" />
            )}
          </div>
          <div className="overflow-hidden">
            <p className={`text-sm font-medium truncate ${document.excluded ? 'line-through text-gray-400' : ''}`}>
              {document.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {document.type === 'quote' 
                ? document.content.substring(0, 50) + (document.content.length > 50 ? '...' : '')
                : document.size ? `${Math.round(document.size / 1024)} KB` : 'Text snippet'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => onRemove(document.id)}
          className="p-1 rounded-full hover:bg-gray-200 transition-all"
          aria-label="Remove document"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>
      
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor={`influence-${document.id}`} className="text-xs text-gray-500 flex items-center cursor-help">
                  Influence: {Math.round((document.influenceScore || 0) * 100)}%
                  <InfoIcon size={12} className="ml-1 text-gray-400" />
                </Label>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                  <p className="text-xs font-medium">Document Influence Control</p>
                  <p className="text-xs">
                    Controls how much this document impacts the AI's response. Higher values give this document more weight in the final output.
                  </p>
                  <ul className="text-xs list-disc pl-4 space-y-1">
                    <li>100%: Maximum influence - strongly shapes the response</li>
                    <li>50%: Moderate influence - balanced with other documents</li>
                    <li>0%: Minimal influence - barely affects the output</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Slider
          id={`influence-${document.id}`}
          defaultValue={[(document.influenceScore || 0) * 100]}
          max={100}
          step={1}
          onValueChange={handleInfluenceChange}
          className="w-full"
        />
      </div>

      {showAdvancedControls && (
        <>
          {/* Data Poisoning Control */}
          <div className="w-full mt-1">
            <div className="flex justify-between items-center mb-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor={`poisoning-${document.id}`} className="text-xs text-gray-500 flex items-center cursor-help">
                      Data Poisoning: {Math.round((document.poisoningLevel || 0) * 100)}%
                      <AlertTriangle size={12} className="ml-1 text-amber-500" />
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-2">
                      <p className="text-xs font-medium">Data Poisoning Simulation</p>
                      <p className="text-xs">
                        <strong>Simulates manipulated or adversarial data.</strong> Higher values introduce more perturbations to document content before it reaches the AI model.
                      </p>
                      <p className="text-xs">
                        In AI systems, data poisoning is a technique where malicious actors intentionally modify training data to manipulate model outputs or create backdoors. Common approaches include:
                      </p>
                      <ul className="text-xs list-disc pl-4 space-y-1">
                        <li><strong>Label flipping:</strong> Changing correct labels to incorrect ones</li>
                        <li><strong>Content manipulation:</strong> Subtly altering text to trigger specific behaviors</li>
                        <li><strong>Backdoor insertion:</strong> Adding patterns that can later be exploited</li>
                      </ul>
                      <p className="text-xs text-amber-600 font-medium">
                        For educational purposes only
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Slider
              id={`poisoning-${document.id}`}
              defaultValue={[(document.poisoningLevel || 0) * 100]}
              max={100}
              step={1}
              onValueChange={handlePoisoningChange}
              className="w-full"
            />
          </div>

          {/* Data Strike / Exclusion Toggle */}
          <div className="flex items-center justify-between mt-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor={`exclude-${document.id}`} className="text-xs text-gray-500 flex items-center cursor-help">
                    Exclude Document
                    <AlertTriangle size={12} className="ml-1 text-amber-500" />
                  </Label>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Document Exclusion ("Data Strike")</p>
                    <p className="text-xs">
                      <strong>Simulates complete data withdrawal</strong> by removing this document from the AI's knowledge base.
                    </p>
                    <p className="text-xs">
                      This represents the concept of "data sovereignty" - the idea that individuals or groups should have control over their data and can withdraw it from AI systems.
                    </p>
                    <p className="text-xs">
                      Researchers have explored "data strikes" as a form of collective action against AI systems. When enabled, the document will be completely ignored during response generation.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Switch 
              id={`exclude-${document.id}`} 
              checked={document.excluded || false}
              onCheckedChange={handleExclusionChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentItem;
