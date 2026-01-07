import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Subject, Task } from '../types';
import { Plus, Calendar, Trash2, CheckCircle, Circle, BookMarked } from 'lucide-react';

const Planner: React.FC = () => {
  const { tasks, addTask, toggleTask, deleteTask } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState<Subject>(Subject.MATH);
  const [newTaskDate, setNewTaskDate] = useState('');

  const handleAdd = () => {
    if (!newTaskTitle || !newTaskDate) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      subject: newTaskSubject,
      dueDate: new Date(newTaskDate).toISOString(),
      completed: false
    };
    
    addTask(task);
    setIsAdding(false);
    setNewTaskTitle('');
    setNewTaskDate('');
  };

  const getSubjectColorStyles = (subject: Subject) => {
    switch (subject) {
      case Subject.MATH: 
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' };
      case Subject.SCIENCE: 
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' };
      case Subject.ENGLISH: 
        return { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700' };
      case Subject.HISTORY: 
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' };
      case Subject.CS: 
        return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' };
      default: 
        return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Task Planner</h1>
          <p className="text-slate-500 font-medium">Organize your assignments by subject.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-bold"
        >
          <Plus className="w-5 h-5" /> Add Assignment
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-indigo-100 mb-8 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-500" />
            New Assignment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Title</label>
              <input 
                type="text" 
                placeholder="e.g. Algebra Worksheet 4" 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Subject</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900"
                value={newTaskSubject}
                onChange={(e) => setNewTaskSubject(e.target.value as Subject)}
              >
                {Object.values(Subject).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Due Date</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-50">
            <button 
              onClick={() => setIsAdding(false)}
              className="px-6 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleAdd}
              disabled={!newTaskTitle || !newTaskDate}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-bold shadow-lg shadow-indigo-200"
            >
              Save Task
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tasks.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <p className="font-medium text-lg">No tasks yet. Good job! 🎉</p>
                <p className="text-sm mt-1">Or add one to get started.</p>
            </div>
        ) : (
            tasks.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(task => {
              const styles = getSubjectColorStyles(task.subject);
              return (
                <div 
                  key={task.id}
                  className={`group flex items-center gap-4 p-5 rounded-2xl border-l-[6px] transition-all duration-300 hover:shadow-md bg-white ${
                    task.completed 
                      ? 'border-slate-300 opacity-60' 
                      : `${styles.border} border-slate-100`
                  }`}
                  style={{ borderLeftColor: !task.completed ? undefined : '#cbd5e1' }} 
                >
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`shrink-0 transition-colors ${task.completed ? 'text-slate-400' : 'text-slate-300 hover:text-indigo-500'}`}
                  >
                    {task.completed ? <CheckCircle className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-lg truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${styles.badge}`}>
                        {task.subject}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default Planner;