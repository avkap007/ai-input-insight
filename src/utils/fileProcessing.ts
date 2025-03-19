
import { Document } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export const isFileSizeValid = (size: number): boolean => {
  return size <= MAX_FILE_SIZE;
};

export const createDocumentFromTextFile = (
  file: File, 
  content: string
): Document => {
  return {
    id: uuidv4(),
    name: file.name,
    type: 'text',
    content: content,
    size: file.size,
    influenceScore: 0.5,
    poisoningLevel: 0,
    excluded: false
  };
};

export const createDocumentFromPdfFile = (
  file: File, 
  content: string
): Document => {
  // For PDFs, we need to extract the text content rather than showing the base64 data
  // In a production app, this would use a PDF parsing library
  let processedContent = "This PDF file was uploaded successfully. In a production environment, the text would be extracted for analysis.";
  
  // In a real implementation, we would use a PDF parsing library like pdf.js
  // This is a placeholder for demonstration purposes
  if (content.startsWith('data:application/pdf;base64,')) {
    // Remove the data URL prefix to get just the base64 content
    const base64Content = content.replace('data:application/pdf;base64,', '');
    
    // In a production app, we would decode and parse the PDF here
    // For now, we'll just acknowledge we received the PDF data
    if (base64Content.length > 100) {
      processedContent += `\n\nThe PDF contains ${Math.round(base64Content.length / 1000)}KB of data.`;
    }
  }
  
  return {
    id: uuidv4(),
    name: file.name,
    type: 'pdf',
    content: processedContent,
    size: file.size,
    influenceScore: 0.5,
    poisoningLevel: 0,
    excluded: false
  };
};
