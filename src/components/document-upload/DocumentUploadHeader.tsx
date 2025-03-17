
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DocumentUploadHeaderProps {
  documentsCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const DocumentUploadHeader: React.FC<DocumentUploadHeaderProps> = ({
  documentsCount,
  isExpanded,
  onToggleExpand
}) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">Source Documents</h2>
        <div className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
          {documentsCount}
        </div>
      </div>
      <button 
        onClick={onToggleExpand}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  );
};

export default DocumentUploadHeader;
