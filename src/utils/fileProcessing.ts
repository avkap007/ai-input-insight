
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
    extractedContent = `The world of magic awaits those who seek it. Beyond the mundane exists a realm where wands channel power, potions bubble with possibility, and ancient creatures roam. Children with special gifts find themselves called to hidden schools, where they learn to harness their abilities while navigating friendship, rivalry, and the eternal struggle between good and evil.

The castle stood against the evening sky, its many towers reaching toward the stars. Inside, corridors twisted in impossible directions, staircases moved at their own whim, and portraits whispered secrets to one another when students weren't listening. In this place, ordinary rules of the world did not apply.

"First years, this way please!" called a prefect with a shiny badge. "Mind the vanishing step, and do try to remember the password. It changes every fortnight, and I won't be there to remind you every time."`;
  } 
  else if (fileName.toLowerCase().includes('rooney') || fileName.toLowerCase().includes('normal')) {
    extractedContent = `In the quiet moments between people, the most profound connections form. University students navigate the complexities of modern relationships, their intellectual discussions giving way to intimate revelations. The emails and text messages they exchange become artifacts of their evolving understanding of one another, punctuated by moments of miscommunication and clarity.

She looked at her phone again, reading his message for the fifth time. Was there a hint of irony in his choice of words, or was she projecting her own insecurities onto the black and white text? She typed three different responses, deleting each one before finally settling on something that struck the right balance between casual and considerate.

Their conversations had always been like this—layers of meaning beneath seemingly ordinary exchanges, a shared vocabulary that had evolved over months of careful attention to one another's thoughts.`;
  }
  else if (fileName.toLowerCase().includes('orwell') || fileName.toLowerCase().includes('dystopian')) {
    extractedContent = `The state watches all, knows all, controls all. In a world where truth is manipulated and history rewritten at will, individuals struggle to maintain their humanity. The machinery of power grinds relentlessly, turning citizens into extensions of its will, while those who question the narrative find themselves erased from existence.

He looked up at the imposing Ministry building, its shadow falling across the street like a promise of judgment. The telescreen in his apartment had been acting strangely—periods of unexpected silence when it should have been broadcasting the mandatory evening news. He wondered if it was a malfunction or if they were listening more intently during those quiet moments.

The thought came unbidden, dangerous in its clarity: What if everything they've told us is a lie? He pushed it away immediately, knowing that thoughtcrime was the most serious offense of all. Even thinking about thinking it was risky.`;
  }
  else if (fileName.toLowerCase().includes('poetic') || fileName.toLowerCase().includes('prose')) {
    extractedContent = `The morning light filters through curtains, dust motes dancing in golden beams. A cup of tea cools on the windowsill, steam spiraling upward in delicate patterns. Outside, the world awakens in stages - first birds, then distant traffic, finally human voices calling to one another across the growing day.

Raindrops collect on the leaves, each one a perfect sphere containing reflections of the garden in miniature. Time slows in these moments of observation, the spaces between heartbeats stretching into contemplation.

The old book's pages release their scent of vanilla and wood as they turn, stories preserved in aging paper and the minds of those who read them. Words written decades ago find new meaning in the present moment, conversations across time between author and reader.`;
  }
  else if (fileName.toLowerCase().includes('academic') || fileName.toLowerCase().includes('research')) {
    extractedContent = `Recent advancements in computational models have demonstrated significant improvements in predictive accuracy across multiple domains. The integration of deep learning architectures with traditional statistical methods has yielded particularly promising results, especially when applied to large-scale datasets with complex interdependencies.

Several factors contribute to the effectiveness of these hybrid approaches. First, the flexibility of neural networks allows for the detection of non-linear relationships that might be missed by conventional analyses. Second, the incorporation of domain-specific knowledge through carefully designed loss functions helps to constrain the solution space in meaningful ways. Third, regularization techniques mitigate the risk of overfitting, ensuring that the models generalize well to unseen data.

In our experimental evaluation, we compare performance across five metrics, including precision, recall, and computational efficiency. The results indicate a statistically significant advantage for the proposed method (p < 0.01), with an average improvement of 17.3% over the previous state-of-the-art.`;
  }
  else {
    extractedContent = `This document appears to be about ${fileName.toLowerCase()}. The content would typically be extracted from the PDF file. For this demonstration, we're creating simulated content based on the filename.

In a production environment, we would use a proper PDF parsing library to extract the actual text content from the document. This would involve analyzing the PDF structure, extracting text elements, and potentially even processing images for additional context.

The extracted content would then be processed further to maintain formatting where appropriate, identify headings and sections, and prepare the text for effective use by language models. Additional metadata such as author, creation date, and document structure would also be preserved when available.`;
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
