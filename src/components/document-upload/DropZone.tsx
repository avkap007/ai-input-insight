import React from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange
}) => {
  return (
    <div 
      className={cn(
        "relative h-28 rounded-lg border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-2 p-4",
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Upload size={20} className="text-gray-500" />
      <p className="text-sm text-center text-gray-700">
        <span className="font-medium">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-gray-500">PDF, TXT, or text snippet (max 5MB)</p>
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        onChange={onFileInputChange}
        accept=".pdf,.txt,text/plain"
      />
    </div>
  );
};

export default DropZone;