
import React from 'react';
import { Document } from '@/types';
import DocumentItem from './DocumentItem';

interface DocumentsListProps {
  documents: Document[];
  onRemoveDocument: (id: string) => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ documents, onRemoveDocument }) => {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-2.5 max-h-48 overflow-y-auto elegant-scrollbar pr-1">
      {documents.map(doc => (
        <DocumentItem 
          key={doc.id} 
          document={doc} 
          onRemove={onRemoveDocument} 
        />
      ))}
    </div>
  );
};

export default DocumentsList;
