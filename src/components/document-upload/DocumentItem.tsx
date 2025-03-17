
import React from 'react';
import { File, FileText, X } from 'lucide-react';
import { Document } from '@/types';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface DocumentItemProps {
  document: Document;
  onRemove: (id: string) => void;
  onInfluenceChange: (id: string, value: number) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ 
  document, 
  onRemove, 
  onInfluenceChange 
}) => {
  const handleInfluenceChange = (value: number[]) => {
    onInfluenceChange(document.id, value[0]);
  };

  return (
    <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex flex-col gap-2 group animate-scale-in">
      <div className="flex items-center justify-between overflow-hidden">
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
          className="p-1 rounded-full hover:bg-gray-200 transition-all"
          aria-label="Remove document"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>
      
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <Label htmlFor={`influence-${document.id}`} className="text-xs text-gray-500">
            Influence: {Math.round(document.influenceScore * 100)}%
          </Label>
        </div>
        <Slider
          id={`influence-${document.id}`}
          defaultValue={[document.influenceScore * 100]}
          max={100}
          step={1}
          onValueChange={handleInfluenceChange}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default DocumentItem;
