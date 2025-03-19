
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
  // For PDFs, instead of storing the raw base64 data, we'll store a placeholder
  // with the file name and simulated content for demo purposes
  // In a real app, we would use a PDF parsing library
  
  const fileName = file.name.replace('.pdf', '').replace(/_/g, ' ');
  
  // Generate sample content based on the filename 
  // (this simulates extracting text from the PDF)
  let extractedContent = '';
  
  if (fileName.toLowerCase().includes('rowling') || fileName.toLowerCase().includes('harry')) {
    extractedContent = `The world of magic awaits those who seek it. Beyond the mundane exists a realm where wands channel power, potions bubble with possibility, and ancient creatures roam. Children with special gifts find themselves called to hidden schools, where they learn to harness their abilities while navigating friendship, rivalry, and the eternal struggle between good and evil.`;
  } 
  else if (fileName.toLowerCase().includes('rooney') || fileName.toLowerCase().includes('normal')) {
    extractedContent = `In the quiet moments between people, the most profound connections form. University students navigate the complexities of modern relationships, their intellectual discussions giving way to intimate revelations. The emails and text messages they exchange become artifacts of their evolving understanding of one another, punctuated by moments of miscommunication and clarity.`;
  }
  else if (fileName.toLowerCase().includes('orwell') || fileName.toLowerCase().includes('dystopian')) {
    extractedContent = `The state watches all, knows all, controls all. In a world where truth is manipulated and history rewritten at will, individuals struggle to maintain their humanity. The machinery of power grinds relentlessly, turning citizens into extensions of its will, while those who question the narrative find themselves erased from existence.`;
  }
  else if (fileName.toLowerCase().includes('poetic') || fileName.toLowerCase().includes('prose')) {
    extractedContent = `The morning light filters through curtains, dust motes dancing in golden beams. A cup of tea cools on the windowsill, steam spiraling upward in delicate patterns. Outside, the world awakens in stages - first birds, then distant traffic, finally human voices calling to one another across the growing day.`;
  }
  else {
    extractedContent = `This document appears to be about ${fileName.toLowerCase()}. The content would typically be extracted from the PDF file. For this demonstration, we're creating simulated content based on the filename.`;
  }
  
  return {
    id: uuidv4(),
    name: file.name,
    type: 'pdf',
    content: extractedContent,
    size: file.size,
    influenceScore: 0.5,
    poisoningLevel: 0,
    excluded: false
  };
};
