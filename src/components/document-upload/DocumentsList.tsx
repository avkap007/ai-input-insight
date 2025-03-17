
import React from 'react';
import { Document } from '@/types';
import DocumentItem from './DocumentItem';

interface DocumentsListProps {
  documents: Document[];
  onRemoveDocument: (id: string) => void;
  onUpdateInfluence: (id: string, value: number) => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ 
  documents, 
  onRemoveDocument, 
  onUpdateInfluence 
}) => {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-2.5 max-h-60 overflow-y-auto elegant-scrollbar pr-1">
      {documents.map(doc => (
        <DocumentItem 
          key={doc.id} 
          document={doc} 
          onRemove={onRemoveDocument} 
          onInfluenceChange={(id, value) => onUpdateInfluence(id, value / 100)}
        />
      ))}
    </div>
  );
};

export default DocumentsList;
