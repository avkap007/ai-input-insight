
import React from 'react';
import { Document } from '@/types';
import DocumentItem from './DocumentItem';

interface DocumentsListProps {
  documents: Document[];
  onRemoveDocument: (id: string) => void;
  onUpdateInfluence: (id: string, value: number) => void;
  onUpdatePoisoning?: (id: string, value: number) => void;
  onUpdateExclusion?: (id: string, value: boolean) => void;
  showAdvancedControls?: boolean;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ 
  documents, 
  onRemoveDocument, 
  onUpdateInfluence,
  onUpdatePoisoning,
  onUpdateExclusion,
  showAdvancedControls = false
}) => {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-2.5 max-h-[500px] overflow-y-auto elegant-scrollbar pr-1">
      {documents.map(doc => (
        <DocumentItem 
          key={doc.id} 
          document={doc} 
          onRemove={onRemoveDocument} 
          onInfluenceChange={onUpdateInfluence}
          onPoisoningChange={onUpdatePoisoning}
          onExclusionChange={onUpdateExclusion}
          showAdvancedControls={showAdvancedControls}
        />
      ))}
    </div>
  );
};

export default DocumentsList;
