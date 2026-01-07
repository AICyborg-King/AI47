import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { GraduationCap, ArrowRight, BookOpen, Loader2 } from 'lucide-react';

const Auth: React.FC = () => {
  const { login } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) return;
    
    setIsSubmitting(true);

    // Formspree Integration with Deduplication
    const sentKey = `formspree_sent_${email}`;
    const hasSent = localStorage.getItem(sentKey);

    if (!hasSent) {
      try {
        await fetch("https://formspree.io/f/meeobwng", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            email: email,
            name: name || (isLogin ? "Returning User" : "New User"),
            type: isLogin ? "Login" : "Signup",
            timestamp: new Date().toISOString()
          })
        });
        // Mark this email as sent in this browser to prevent duplication
        localStorage.setItem(sentKey, 'true');
      } catch (error) {
        console.error("Formspree error:", error);
        // Continue with login even if tracking fails
      }
    }

    // Complete authentication
    login(email, isLogin ? email.split('@')[0] : name);
    // Note: We don't set isSubmitting(false) because the component will unmount upon successful login
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Brand */}
        <div className="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 opacity-20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <GraduationCap className="w-8 h-8" />
              </div>
              <span className="text-2xl font-bold tracking-tight">EDUFLY</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Master your studies with AI assistance.
            </h1>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Join thousands of students using EduFly to organize homework, understand complex topics, and ace their exams.
            </p>
          </div>

          <div className="relative z-10 flex gap-4 text-indigo-200 text-sm font-medium">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Smart Notes
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" /> AI Tutor
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="text-slate-500 mb-8">
            {isLogin ? 'Please enter your details to sign in.' : 'Start your learning journey today.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="student@school.edu"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 font-bold hover:underline"
              disabled={isSubmitting}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;