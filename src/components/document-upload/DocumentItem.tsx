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
    if (kb < 1024) return `${Math.round(kb * 10) / 10} KB`;
    const mb = kb / 1024;
    return `${Math.round(mb * 10) / 10} MB`;
  };

  return (
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
          <div className="text-sm font-medium text-gray-900 truncate" title={name}>{name}</div>
          {size && <div className="text-xs text-gray-500 mt-0.5">{formatSize(size)}</div>}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`influence-${id}`} className="text-xs font-medium text-gray-700">
          Influence: {Math.round(influenceScore * 100)}%
        </label>
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
        <div className="flex flex-col gap-2 mt-2">
          {onPoisoningChange && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`poisoning-${id}`} className="text-xs font-medium text-gray-700">
                Poisoning: {Math.round(poisoningLevel * 100)}%
              </label>
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
      )}

      <button
        onClick={() => onRemove(id)}
        className="text-gray-400 hover:text-gray-600 transition-colors self-end"
        aria-label="Remove document"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default DocumentItem;