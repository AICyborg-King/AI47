import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Task, Note, Subject, QuizResult } from '../types';

interface StoreContextType {
  user: User | null;
  login: (email: string, name: string) => void;
  logout: () => void;
  tasks: Task[];
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  notes: Note[];
  addNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  quizResults: QuizResult[];
  addQuizResult: (result: QuizResult) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Mock initial data
const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Complete Algebra Worksheet', subject: Subject.MATH, dueDate: new Date(Date.now() + 86400000).toISOString(), completed: false },
  { id: '2', title: 'Read Chapter 4 of Great Gatsby', subject: Subject.ENGLISH, dueDate: new Date(Date.now() + 172800000).toISOString(), completed: true },
];

const INITIAL_NOTES: Note[] = [
  { 
    id: '1', 
    title: 'Photosynthesis Cycle', 
    subject: Subject.SCIENCE, 
    content: 'Light-dependent reactions take place in the thylakoid membrane...', 
    createdAt: new Date().toISOString(), 
    tags: ['biology', 'plants'] 
  }
];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  // Simulate persistent login for demo
  useEffect(() => {
    const savedUser = localStorage.getItem('edufly_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email: string, name: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      gradeLevel: '10th Grade',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };
    setUser(newUser);
    localStorage.setItem('edufly_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('edufly_user');
  };

  const addTask = (task: Task) => setTasks([...tasks, task]);
  
  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const addNote = (note: Note) => setNotes([note, ...notes]);
  
  const deleteNote = (id: string) => setNotes(notes.filter(n => n.id !== id));

  const addQuizResult = (result: QuizResult) => setQuizResults([result, ...quizResults]);

  return (
    <StoreContext.Provider value={{
      user, login, logout,
      tasks, addTask, toggleTask, deleteTask,
      notes, addNote, deleteNote,
      quizResults, addQuizResult
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};