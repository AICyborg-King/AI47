import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ChatTutor from './pages/ChatTutor';
import Planner from './pages/Planner';
import Notes from './pages/Notes';
import QuizMode from './pages/QuizMode';

const AppContent: React.FC = () => {
  const { user } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'chat': return <ChatTutor />;
      case 'planner': return <Planner />;
      case 'notes': return <Notes />;
      case 'quiz': return <QuizMode />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;