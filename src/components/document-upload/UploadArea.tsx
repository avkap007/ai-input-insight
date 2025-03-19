
import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Document } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface UploadAreaProps {
  onDocumentUpload: (document: Document) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onDocumentUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
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
    
    // Check file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB. Please upload a smaller file.",
        variant: "destructive",
      });
      setUploadingProgress(null);
      return;
    }
    
    if (file.name.endsWith('.pdf')) {
      // For PDF files, use array buffer and encode as base64
      const reader = new FileReader();
      
      reader.onload = (event) => {
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
        
        // Get the content as base64 string
        const content = event.target?.result as string;
        
        setTimeout(() => {
          const newDocument: Document = {
            id: uuidv4(),
            name: file.name,
            type: 'pdf',
            content: content,
            size: file.size,
            influenceScore: 0.5,
            poisoningLevel: 0,
            excluded: false
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
      
      // Read as data URL (base64 encoded) for PDFs
      reader.readAsDataURL(file);
    } else {
      // For text files, use text encoding as before
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
            poisoningLevel: 0,
            excluded: false
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
    }
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

  return (
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
      <p className="text-xs text-gray-400">PDF, TXT, or text snippet (max 5MB)</p>
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
  );
};

export default UploadArea;
