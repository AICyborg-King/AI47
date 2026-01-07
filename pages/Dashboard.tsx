import React from 'react';
import { useStore } from '../context/StoreContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Clock, CheckCircle2, Trophy, ArrowRight, Sparkles } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, tasks, quizResults } = useStore();

  const pendingTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalScore = quizResults.reduce((acc, curr) => acc + curr.score, 0);
  const averageScore = quizResults.length ? Math.round((totalScore / (quizResults.length * 5)) * 100) : 0;

  // Chart data with specific educational colors
  const chartData = [
    { name: 'Math', hours: 4, color: '#3B82F6' },    // Blue
    { name: 'Science', hours: 3, color: '#10B981' }, // Emerald
    { name: 'English', hours: 5, color: '#EC4899' }, // Pink
    { name: 'History', hours: 2, color: '#F59E0b' }, // Amber
    { name: 'CS', hours: 6, color: '#8B5CF6' },      // Violet
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Hi, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{user?.name.split(' ')[0]}</span>! 👋
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Ready to learn something new today?</p>
        </div>
        <div className="text-sm font-medium px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm text-slate-600">
          📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </header>

      {/* Stats Grid - Colourful Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3.5 bg-white rounded-2xl shadow-sm text-blue-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-600/80 uppercase tracking-wide">Pending Tasks</p>
              <p className="text-3xl font-black text-slate-900">{pendingTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3.5 bg-white rounded-2xl shadow-sm text-emerald-600">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-600/80 uppercase tracking-wide">Avg. Score</p>
              <p className="text-3xl font-black text-slate-900">{averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 p-6 rounded-3xl border border-violet-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3.5 bg-white rounded-2xl shadow-sm text-violet-600">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-violet-600/80 uppercase tracking-wide">Study Time</p>
              <p className="text-3xl font-black text-slate-900">12.5h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            Weekly Focus
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px 20px'
                  }}
                  itemStyle={{ fontWeight: 600, color: '#1e293b' }}
                />
                <Bar dataKey="hours" radius={[8, 8, 8, 8]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent/Suggestions */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -ml-16 -mb-16"></div>
          
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Recommended
          </h2>
          
          <div className="space-y-4 flex-1 relative z-10">
            <button 
              onClick={() => onNavigate('quiz')}
              className="w-full text-left p-4 rounded-2xl bg-white/10 hover:bg-white/15 transition-all border border-white/5 backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Math Quiz</h3>
                  <p className="text-sm text-indigo-200">Test your Algebra skills</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-500/50 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => onNavigate('chat')}
              className="w-full text-left p-4 rounded-2xl bg-white/10 hover:bg-white/15 transition-all border border-white/5 backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Ask AI Tutor</h3>
                  <p className="text-sm text-purple-200">Get help with homework</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-purple-500/50 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </button>

            {tasks.length > 0 && (
              <button 
                onClick={() => onNavigate('planner')}
                className="w-full text-left p-4 rounded-2xl bg-white/10 hover:bg-white/15 transition-all border border-white/5 backdrop-blur-sm group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">Planner</h3>
                    <p className="text-sm text-emerald-200">{pendingTasks} tasks due soon</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/50 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;