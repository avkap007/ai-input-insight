
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
  return {
    id: uuidv4(),
    name: file.name,
    type: 'pdf',
    content: content,
    size: file.size,
    influenceScore: 0.5,
    poisoningLevel: 0,
    excluded: false
  };
};
