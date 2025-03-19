
import React, { useState } from 'react';
import { Document } from '@/types';
import { cn } from '@/lib/utils';
import DocumentUploadHeader from './document-upload/DocumentUploadHeader';
import UploadArea from './document-upload/UploadArea';
import AddTextButton from './document-upload/AddTextButton';
import DocumentsList from './document-upload/DocumentsList';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface DocumentUploadProps {
  onDocumentUpload: (document: Document) => void;
  documents: Document[];
  onRemoveDocument: (id: string) => void;
  onUpdateDocumentInfluence: (id: string, influenceScore: number) => void;
  onUpdateDocumentPoisoning?: (id: string, poisoningLevel: number) => void;
  onUpdateDocumentExclusion?: (id: string, excluded: boolean) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onDocumentUpload, 
  documents,
  onRemoveDocument,
  onUpdateDocumentInfluence,
  onUpdateDocumentPoisoning,
  onUpdateDocumentExclusion
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  return (
    <div className="w-full animate-fade-in">
      <DocumentUploadHeader
        documentsCount={documents.length}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
      />
      
      {isExpanded && (
        <>
          <UploadArea onDocumentUpload={onDocumentUpload} />
          
          <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <Switch
                        id="advanced-controls"
                        checked={showAdvancedControls}
                        onCheckedChange={setShowAdvancedControls}
                        className="mr-2"
                      />
                      <Label htmlFor="advanced-controls" className="text-xs cursor-pointer">
                        Advanced Controls
                      </Label>
                      <Info size={12} className="ml-1 text-gray-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Enable advanced controls for data poisoning experiments and document exclusion.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <AddTextButton 
              onDocumentUpload={onDocumentUpload} 
              documentsCount={documents.length} 
            />
          </div>
          
          <DocumentsList 
            documents={documents} 
            onRemoveDocument={onRemoveDocument}
            onUpdateInfluence={onUpdateDocumentInfluence}
            onUpdatePoisoning={onUpdateDocumentPoisoning}
            onUpdateExclusion={onUpdateDocumentExclusion}
            showAdvancedControls={showAdvancedControls}
          />
        </>
      )}
    </div>
  );
};

export default DocumentUpload;
