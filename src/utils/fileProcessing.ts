import { Document } from "@/types";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = "http://127.0.0.1:8000";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export const isFileSizeValid = (size: number): boolean => {
  return size <= MAX_FILE_SIZE;
};

export const createDocumentFromTextFile = async (file: File): Promise<Document> => {
  const content = await file.text();

  return {
    id: uuidv4(),
    name: file.name,
    type: "text",
    content,
    size: file.size,
    influenceScore: 0.5,
    poisoningLevel: 0,
    excluded: false,
  };
};

export const createDocumentFromPdfFile = async (file: File): Promise<Document> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/extract-pdf-text`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("PDF text extraction failed");
    }

    const data = await response.json();
    return {
      id: uuidv4(),
      name: file.name,
      type: "pdf",
      content: data.extracted_text || "Could not extract text",
      size: file.size,
      influenceScore: 0.5,
      poisoningLevel: 0,
      excluded: false,
    };
  } catch (error) {
    console.error("Error processing PDF file:", error);
    throw error;
  }
};
