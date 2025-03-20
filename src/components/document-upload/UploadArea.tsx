
import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { documentClient } from "@/utils/apiClients"; // Ensure this exists
import DropZone from "./DropZone";
import UploadProgress from "./UploadProgress";
import { isFileSizeValid } from "@/utils/fileProcessing"; // Ensure this exists

interface UploadAreaProps {
  onDocumentUpload: (document: any) => void;
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
      setUploadingProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          callback();
          return null;
        }
        return prev + 10;
      });
    }, 100);
  };

  const processFile = async (file: File) => {
    if (!isFileSizeValid(file.size)) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingProgress(0);
      simulateUploadProgress(() => setUploadingProgress(null));

      // Upload document to FastAPI
      const uploadedDocument = await documentClient.uploadDocument(file);
      onDocumentUpload(uploadedDocument);

      toast({
        title: "Document uploaded",
        description: `${file.name} has been uploaded.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document.",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
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
      {uploadingProgress !== null && <UploadProgress progress={uploadingProgress} />}
    </div>
  );
};

export default UploadArea;
