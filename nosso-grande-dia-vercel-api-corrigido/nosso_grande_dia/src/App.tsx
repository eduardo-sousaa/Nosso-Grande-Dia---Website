import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { FirstAccessModal } from './components/FirstAccessModal';
import { AuthScreen } from './components/AuthScreen';

import { Dashboard } from './pages/Dashboard';
import { Planejamento } from './pages/Planejamento';
import { Convidados } from './pages/Convidados';
import { Padrinhos } from './pages/Padrinhos';
import { Ideias } from './pages/Ideias';
import { Orcamento } from './pages/Orcamento';
import { Fornecedores } from './pages/Fornecedores';
import { Documentos } from './pages/Documentos';
import { Diario } from './pages/Diario';
import { Configuracoes } from './pages/Configuracoes';

const MainLayout: React.FC = () => {
  const { user, casamento, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFirstAccessOpen, setIsFirstAccessOpen] = useState(false);

  // Check if first access setup (wedding registration) is needed upon login
  React.useEffect(() => {
    if (user && casamento && casamento.configurado === false) {
      setIsFirstAccessOpen(true);
    }
  }, [user, casamento]);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center font-serif">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#800020] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#800020]">Carregando Nosso Grande Dia...</p>
        </div>
      </div>
    );
  }

  // Auth gate: Require Login / Register first
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col font-sans">
      
      {/* Top Bar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {currentPage === 'dashboard' && (
            <Dashboard
              onNavigate={setCurrentPage}
              onOpenSetup={() => setIsFirstAccessOpen(true)}
            />
          )}
          {currentPage === 'planejamento' && <Planejamento initialSubTab="tarefas" />}
          {currentPage === 'convidados' && <Convidados />}
          {currentPage === 'padrinhos' && <Padrinhos />}
          {currentPage === 'ideias' && <Ideias />}
          {currentPage === 'orcamento' && <Orcamento />}
          {currentPage === 'fornecedores' && <Fornecedores />}
          {currentPage === 'documentos' && <Documentos />}
          {currentPage === 'diario' && <Diario />}
          {currentPage === 'configuracoes' && <Configuracoes />}
        </main>

      </div>

      {/* First Access Setup Modal */}
      <FirstAccessModal
        isOpen={isFirstAccessOpen}
        onClose={() => setIsFirstAccessOpen(false)}
        onSuccess={() => {
          setIsFirstAccessOpen(false);
          setCurrentPage('dashboard');
        }}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainLayout />
      </ThemeProvider>
    </AuthProvider>
  );
}
