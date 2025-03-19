
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Document } from '@/types';
import DropZone from './DropZone';
import UploadProgress from './UploadProgress';
import { isFileSizeValid, createDocumentFromTextFile, createDocumentFromPdfFile } from '@/utils/fileProcessing';

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

  const simulateUploadProgress = (callback: () => void) => {
    setUploadingProgress(0);
    const interval = setInterval(() => {
      setUploadingProgress(prev => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          callback();
          return null;
        }
        return prev + 10;
      });
    }, 100);
    
    return interval;
  };

  const processFile = (file: File) => {
    setUploadingProgress(0);
    
    // Check file size
    if (!isFileSizeValid(file.size)) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB. Please upload a smaller file.",
        variant: "destructive",
      });
      setUploadingProgress(null);
      return;
    }
    
    if (file.name.endsWith('.pdf')) {
      // Process PDF files
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const interval = simulateUploadProgress(() => {
          const content = event.target?.result as string;
          const newDocument = createDocumentFromPdfFile(file, content);
          
          onDocumentUpload(newDocument);
          
          toast({
            title: "Document uploaded",
            description: `${file.name} has been added to your sources.`,
          });
        });
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
      // Process text files
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        
        const interval = simulateUploadProgress(() => {
          const newDocument = createDocumentFromTextFile(file, content);
          
          onDocumentUpload(newDocument);
          
          toast({
            title: "Document uploaded",
            description: `${file.name} has been added to your sources.`,
          });
        });
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
    <div className="relative">
      <DropZone
        isDragging={isDragging}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileInputChange={handleFileInput}
      />
      {uploadingProgress !== null && (
        <UploadProgress progress={uploadingProgress} />
      )}
    </div>
  );
};

export default UploadArea;
