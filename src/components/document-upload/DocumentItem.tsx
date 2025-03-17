
import React from 'react';
import { File, FileText, X } from 'lucide-react';
import { Document } from '@/types';

interface DocumentItemProps {
  document: Document;
  onRemove: (id: string) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ document, onRemove }) => {
  return (
    <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between group animate-scale-in">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="shrink-0">
          {document.type === 'pdf' ? (
            <File size={16} className="text-red-500" />
          ) : (
            <FileText size={16} className="text-blue-500" />
          )}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium truncate">{document.name}</p>
          <p className="text-xs text-gray-500 truncate">
            {document.type === 'quote' 
              ? document.content.substring(0, 50) + (document.content.length > 50 ? '...' : '')
              : document.size ? `${Math.round(document.size / 1024)} KB` : 'Text snippet'}
          </p>
        </div>
      </div>
      <button 
        onClick={() => onRemove(document.id)}
        className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
      >
        <X size={14} className="text-gray-500" />
      </button>
    </div>
  );
};

export default DocumentItem;
