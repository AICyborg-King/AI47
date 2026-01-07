import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Subject, Note } from '../types';
import { Plus, Trash2, Search, FileText, Tag, PenLine } from 'lucide-react';

const Notes: React.FC = () => {
  const { notes, addNote, deleteNote } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  
  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState<Subject>(Subject.GENERAL);

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!title || !content) return;
    addNote({
      id: Date.now().toString(),
      title,
      content,
      subject,
      createdAt: new Date().toISOString(),
      tags: []
    });
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSubject(Subject.GENERAL);
  };

  const getSubjectColorStyles = (subject: Subject) => {
    switch (subject) {
      case Subject.MATH: return { border: 'border-blue-500', badge: 'bg-blue-100 text-blue-700' };
      case Subject.SCIENCE: return { border: 'border-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };
      case Subject.ENGLISH: return { border: 'border-pink-500', badge: 'bg-pink-100 text-pink-700' };
      case Subject.HISTORY: return { border: 'border-amber-500', badge: 'bg-amber-100 text-amber-700' };
      case Subject.CS: return { border: 'border-violet-500', badge: 'bg-violet-100 text-violet-700' };
      default: return { border: 'border-slate-500', badge: 'bg-slate-100 text-slate-700' };
    }
  };

  if (isCreating) {
    return (
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <PenLine className="w-6 h-6 text-indigo-500" />
            New Note
          </h2>
          <div className="flex gap-3">
            <button onClick={() => setIsCreating(false)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2.5 font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200">Save Note</button>
          </div>
        </div>
        
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="Note Title" 
              className="flex-1 text-3xl font-black outline-none placeholder:text-slate-300 text-slate-900"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <select 
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none text-slate-700"
              value={subject}
              onChange={e => setSubject(e.target.value as Subject)}
            >
              {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea 
            className="flex-1 w-full resize-none outline-none text-lg text-slate-600 leading-relaxed placeholder:text-slate-300"
            placeholder="Start typing your study notes here..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Study Notes</h1>
          <p className="text-slate-500 font-medium">Capture ideas and organize your thoughts.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" /> Create Note
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="Search by keyword, subject, or title..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-medium"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <p className="font-bold text-lg">No notes found.</p>
            <p className="text-sm">Time to hit the books!</p>
          </div>
        ) : (
          filteredNotes.map(note => {
            const styles = getSubjectColorStyles(note.subject);
            return (
              <div 
                key={note.id} 
                className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col h-72 group relative overflow-hidden border-t-[8px] ${styles.border}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${styles.badge}`}>
                    {note.subject}
                  </span>
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-3 truncate">{note.title}</h3>
                <p className="text-slate-600 text-sm flex-1 overflow-hidden whitespace-pre-wrap line-clamp-6 leading-relaxed">
                  {note.content}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Tag className="w-3.5 h-3.5" />
                  {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notes;