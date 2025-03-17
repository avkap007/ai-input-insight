
import React, { useState } from 'react';
import { Upload, File, X, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Document } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface DocumentUploadProps {
  onDocumentUpload: (document: Document) => void;
  documents: Document[];
  onRemoveDocument: (id: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onDocumentUpload, 
  documents,
  onRemoveDocument
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    setUploadingProgress(0);
    
    // Simulating file reading and processing
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // Simulate progress
      const interval = setInterval(() => {
        setUploadingProgress(prev => {
          if (prev === null) return 0;
          if (prev >= 100) {
            clearInterval(interval);
            return null;
          }
          return prev + 10;
        });
      }, 100);
      
      setTimeout(() => {
        const newDocument: Document = {
          id: uuidv4(),
          name: file.name,
          type: file.name.endsWith('.pdf') ? 'pdf' : 'text',
          content: content,
          size: file.size,
          influenceScore: 0.5,
        };
        
        onDocumentUpload(newDocument);
        clearInterval(interval);
        setUploadingProgress(null);
        
        toast({
          title: "Document uploaded",
          description: `${file.name} has been added to your sources.`,
        });
      }, 1000);
    };
    
    reader.onerror = () => {
      setUploadingProgress(null);
      toast({
        title: "Upload failed",
        description: "There was an error processing your document.",
        variant: "destructive",
      });
    };
    
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleQuickTextAdd = () => {
    const textContent = prompt("Enter your text or quote:");
    if (textContent) {
      const newDocument: Document = {
        id: uuidv4(),
        name: `Quote ${documents.length + 1}`,
        type: 'quote',
        content: textContent,
        influenceScore: 0.5,
      };
      
      onDocumentUpload(newDocument);
      
      toast({
        title: "Text added",
        description: "Your text has been added as a source.",
      });
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Source Documents</h2>
          <div className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {documents.length}
          </div>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {isExpanded && (
        <>
          <div 
            className={cn(
              "relative h-32 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-2",
              isDragging ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload size={20} className="text-gray-400" />
            <p className="text-sm text-center text-gray-500">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400">PDF, TXT, or text snippet</p>
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={handleFileInput}
              accept=".pdf,.txt,text/plain"
            />
            {uploadingProgress !== null && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <div className="w-36">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300" 
                      style={{ width: `${uploadingProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center mt-2 text-gray-500">Uploading...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-3 flex justify-end">
            <button 
              onClick={handleQuickTextAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FileText size={14} />
              Add Text Directly
            </button>
          </div>
          
          {documents.length > 0 && (
            <div className="mt-5 space-y-2.5 max-h-48 overflow-y-auto elegant-scrollbar pr-1">
              {documents.map(doc => (
                <div 
                  key={doc.id}
                  className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between group animate-scale-in"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="shrink-0">
                      {doc.type === 'pdf' ? (
                        <File size={16} className="text-red-500" />
                      ) : (
                        <FileText size={16} className="text-blue-500" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {doc.type === 'quote' 
                          ? doc.content.substring(0, 50) + (doc.content.length > 50 ? '...' : '')
                          : doc.size ? `${Math.round(doc.size / 1024)} KB` : 'Text snippet'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveDocument(doc.id)}
                    className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
                  >
                    <X size={14} className="text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentUpload;
