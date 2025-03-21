
import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Document } from '@/types';

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
    if (kb < 1024) {
      return `${Math.round(kb * 10) / 10} KB`;
    }
    const mb = kb / 1024;
    return `${Math.round(mb * 10) / 10} MB`;
  };

  const getIcon = () => {
    if (type === 'pdf') {
      return <i className="fas fa-file-pdf text-red-500 mr-2"></i>;
    }
    return <i className="fas fa-file-alt text-blue-500 mr-2"></i>;
  };

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 shadow-sm p-3 transition-all",
      excluded ? "opacity-50" : ""
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="mr-2">
            {type === 'pdf' ? (
              <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 truncate max-w-[200px]" title={name}>{name}</h3>
            {size && <p className="text-xs text-gray-500">{formatSize(size)}</p>}
          </div>
        </div>
        <button
          onClick={() => onRemove(id)}
          className="text-gray-400 hover:text-gray-500 transition-colors"
          aria-label="Remove document"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="mt-3 space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <label htmlFor={`influence-${id}`} className="text-xs font-medium text-gray-700">
              Influence: {Math.round(influenceScore * 100)}%
            </label>
          </div>
          <input
            id={`influence-${id}`}
            type="range"
            min="0"
            max="100"
            value={Math.round(influenceScore * 100)}
            onChange={(e) => onInfluenceChange(id, parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
        
        {showAdvancedControls && onPoisoningChange && (
          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor={`poisoning-${id}`} className="text-xs font-medium text-gray-700">
                Poisoning: {Math.round(poisoningLevel * 100)}%
              </label>
            </div>
            <input
              id={`poisoning-${id}`}
              type="range"
              min="0"
              max="100"
              value={Math.round(poisoningLevel * 100)}
              onChange={(e) => onPoisoningChange(id, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>
        )}
        
        {showAdvancedControls && onExclusionChange && (
          <div className="flex items-center justify-between">
            <label htmlFor={`exclude-${id}`} className="text-xs font-medium text-gray-700">
              Exclude from context
            </label>
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
    </div>
  );
};

export default DocumentItem;
