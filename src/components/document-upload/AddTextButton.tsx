
import React from 'react';
import { FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Document } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AddTextButtonProps {
  onDocumentUpload: (document: Document) => void;
  documentsCount: number;
}

const AddTextButton: React.FC<AddTextButtonProps> = ({ onDocumentUpload, documentsCount }) => {
  const { toast } = useToast();

  const handleQuickTextAdd = () => {
    const textContent = prompt("Enter your text or quote:");
    if (textContent) {
      const newDocument: Document = {
        id: uuidv4(),
        name: `Quote ${documentsCount + 1}`,
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
    <button 
      onClick={handleQuickTextAdd}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
    >
      <FileText size={14} />
      Add Text Directly
    </button>
  );
};

export default AddTextButton;
