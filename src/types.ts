export type MessageRole = 'user' | 'model';

export interface Message {
  role: MessageRole;
  text: string;
  image?: string; // base64
}

export type SchoolTerm = '1st Term' | '2nd Term' | '3rd Term';
export type SchoolClass = 'JSS 1' | 'JSS 2' | 'JSS 3' | 'SSS 1' | 'SSS 2' | 'SSS 3';
export type ClassCategory = 'Junior Secondary' | 'Science' | 'Art' | 'Commercial' | 'General';

export interface ClassContext {
  term: SchoolTerm;
  className: SchoolClass;
  category: ClassCategory;
  subject: string;
  topic: string;
  notes?: string;
}
