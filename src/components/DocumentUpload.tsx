
import React, { useState } from 'react';
import { Document } from '@/types';
import { cn } from '@/lib/utils';
import DocumentUploadHeader from './document-upload/DocumentUploadHeader';
import UploadArea from './document-upload/UploadArea';
import AddTextButton from './document-upload/AddTextButton';
import DocumentsList from './document-upload/DocumentsList';

interface DocumentUploadProps {
  onDocumentUpload: (document: Document) => void;
  documents: Document[];
  onRemoveDocument: (id: string) => void;
  onUpdateDocumentInfluence: (id: string, influenceScore: number) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onDocumentUpload, 
  documents,
  onRemoveDocument,
  onUpdateDocumentInfluence
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

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
          
          <div className="mt-3 flex justify-end">
            <AddTextButton 
              onDocumentUpload={onDocumentUpload} 
              documentsCount={documents.length} 
            />
          </div>
          
          <DocumentsList 
            documents={documents} 
            onRemoveDocument={onRemoveDocument}
            onUpdateInfluence={onUpdateDocumentInfluence}
          />
        </>
      )}
    </div>
  );
};

export default DocumentUpload;
