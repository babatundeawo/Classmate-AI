import { GoogleGenAI, Type } from "@google/genai";
import { SchoolTerm, SchoolClass, ClassCategory } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const fetchTopics = async (
  term: SchoolTerm,
  className: SchoolClass,
  subject: string
): Promise<string[]> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";

  const prompt = `
    Provide a list of topics for the Nigerian secondary school curriculum (Scheme of Work) for:
    Class: ${className}
    Term: ${term}
    Subject: ${subject}
    
    Return ONLY a JSON array of strings representing the topics.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (error) {
    console.error("Error fetching topics:", error);
  }

  return [];
};

export const SUBJECTS_BY_CATEGORY: Record<ClassCategory, string[]> = {
  'Junior Secondary': [
    'Mathematics', 'English Language', 'Basic Science', 'Basic Technology', 
    'Social Studies', 'Civic Education', 'Agricultural Science', 'Home Economics',
    'Business Studies', 'Computer Studies (ICT)', 'Physical and Health Education',
    'Christian Religious Studies', 'Islamic Religious Studies', 'French', 'Yoruba', 'Igbo', 'Hausa'
  ],
  'Science': [
    'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 
    'Further Mathematics', 'Agricultural Science', 'Geography', 'Computer Studies (ICT)',
    'Civic Education', 'Economics'
  ],
  'Art': [
    'Mathematics', 'English Language', 'Literature-in-English', 'Government', 
    'History', 'Christian Religious Studies', 'Islamic Religious Studies', 'Civic Education',
    'French', 'Yoruba', 'Igbo', 'Hausa', 'Economics', 'Fine Art'
  ],
  'Commercial': [
    'Mathematics', 'English Language', 'Financial Accounting', 'Commerce', 
    'Economics', 'Government', 'Civic Education', 'Computer Studies (ICT)', 'Geography'
  ],
  'General': [
    'Mathematics', 'English Language', 'Civic Education', 'Economics', 'Geography', 'Biology'
  ]
};
