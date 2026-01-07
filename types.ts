export enum Subject {
  MATH = 'Mathematics',
  SCIENCE = 'Science',
  ENGLISH = 'English',
  HISTORY = 'History',
  CS = 'Computer Science',
  GENERAL = 'General'
}

export interface User {
  id: string;
  name: string;
  email: string;
  gradeLevel: string;
  avatarUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  subject: Subject;
  dueDate: string; // ISO Date string
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subject: Subject;
  createdAt: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizResult {
  id: string;
  subject: Subject;
  score: number;
  totalQuestions: number;
  date: string;
}

export interface LearningStat {
  subject: string;
  hours: number;
  score: number;
}