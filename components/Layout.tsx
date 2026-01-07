import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  MessageSquare, 
  BrainCircuit, 
  LogOut, 
  Menu,
  X,
  GraduationCap
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { user, logout } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
    { id: 'chat', label: 'AI Tutor', icon: MessageSquare, color: 'text-violet-500' },
    { id: 'planner', label: 'Planner', icon: CheckSquare, color: 'text-emerald-500' },
    { id: 'notes', label: 'Notes', icon: BookOpen, color: 'text-amber-500' },
    { id: 'quiz', label: 'Practice', icon: BrainCircuit, color: 'text-rose-500' },
  ];

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 tracking-tight">
          EDUFLY
        </span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium group ${
              currentPage === item.id 
                ? 'bg-slate-900 text-white shadow-md transform scale-[1.02]' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-colors ${
              currentPage === item.id ? 'text-white' : item.color
            }`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-50 rounded-xl border border-slate-100">
          <img src={user?.avatarUrl} alt="Profile" className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-100" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate font-medium">{user?.gradeLevel}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-100 h-full fixed inset-y-0 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <GraduationCap className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900">EDUFLY</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute top-16 left-0 w-72 h-[calc(100vh-4rem)] bg-white flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <NavContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-72 pt-16 md:pt-0 h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;