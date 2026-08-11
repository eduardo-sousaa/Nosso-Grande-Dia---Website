import React from 'react';
import {
  Home,
  CheckSquare,
  Users,
  Lightbulb,
  DollarSign,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentPage?: string;
  activeTab?: string;
  onNavigate?: (page: string) => void;
  setActiveTab?: (tab: string) => void;
  isOpen?: boolean;
  isOpenMobile?: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  activeTab,
  onNavigate,
  setActiveTab,
  isOpen,
  isOpenMobile,
  onClose,
  onCloseMobile
}) => {
  const { user, casamento } = useAuth();
  const current = currentPage || activeTab || 'dashboard';

  const navigate = (page: string) => {
    if (onNavigate) onNavigate(page);
    if (setActiveTab) setActiveTab(page);
    if (onClose) onClose();
    if (onCloseMobile) onCloseMobile();
  };

  const isMobileOpen = isOpen || isOpenMobile || false;

  // Derive couple initials for monogram
  const initials = React.useMemo(() => {
    if (!casamento) return 'N&D';
    const noivo = casamento.nome_noivo ? casamento.nome_noivo[0] : 'G';
    const noiva = casamento.nome_noiva ? casamento.nome_noiva[0] : 'I';
    return `${noivo}&${noiva}`;
  }, [casamento]);

  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: Home, emoji: '🏠' },
    {
      id: 'planejamento',
      label: 'Planejamento',
      icon: CheckSquare,
      emoji: '📋'
    },
    {
      id: 'convidados',
      label: 'Convidados',
      icon: Users,
      emoji: '👥'
    },
    {
      id: 'padrinhos',
      label: 'Padrinhos',
      icon: Users,
      emoji: '💍'
    },
    { id: 'ideias', label: 'Inspirações', icon: Lightbulb, emoji: '💡' },
    {
      id: 'orcamento',
      label: 'Orçamento',
      icon: DollarSign,
      emoji: '💰'
    },
    {
      id: 'fornecedores',
      label: 'Fornecedores',
      icon: DollarSign,
      emoji: '🏢'
    }
  ];

  const navContent = (
    <div className="flex flex-col h-full bg-[#FDFCF8]">
      {/* Brand Monogram Header */}
      <div className="p-6 md:p-8 flex flex-col items-center border-b border-[#E5E2D9]">
        <div className="w-16 h-16 rounded-full border-2 border-[#800020] mb-3 p-1 flex items-center justify-center overflow-hidden bg-white shadow-xs">
          <span className="text-[#800020] font-serif text-2xl italic font-bold tracking-tighter">{initials}</span>
        </div>
        <h1 className="text-xs uppercase tracking-widest font-semibold text-[#556B2F]">Nosso Grande Dia</h1>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const isActive = current === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium text-sm text-left ${
                isActive
                  ? 'bg-[#F4F1E8] text-[#800020] font-bold shadow-2xs'
                  : 'text-[#2D2D2D] hover:bg-[#F4F1E8] opacity-80 hover:opacity-100'
              }`}
            >
              <span className="text-lg leading-none">{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-5 border-t border-[#E5E2D9] mt-auto">
        <div className="flex items-center space-x-3">
          {user?.foto ? (
            <img src={user.foto} alt={user.nome} className="w-8 h-8 rounded-full object-cover border border-[#800020]/30" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#556B2F] flex items-center justify-center text-white text-xs font-bold">
              {user?.nome ? user.nome.substring(0, 2).toUpperCase() : 'US'}
            </div>
          )}
          <div className="text-xs min-w-0">
            <p className="font-bold text-[#2D2D2D] truncate">{user?.nome || 'Gabriel'}</p>
            <p className="text-[#556B2F] font-medium opacity-80 text-[10px]">Acessando agora</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-[#E5E2D9] flex-col bg-[#FDFCF8] shrink-0 min-h-[calc(100vh-80px)] rounded-3xl overflow-hidden my-2 shadow-2xs">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#2D2D2D]/40 backdrop-blur-xs transition-opacity"
            onClick={() => {
              if (onClose) onClose();
              if (onCloseMobile) onCloseMobile();
            }}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#FDFCF8] h-full shadow-2xl flex flex-col z-10 border-r border-[#E5E2D9]">
            <div className="p-3 border-b border-[#E5E2D9] flex items-center justify-end">
              <button
                onClick={() => {
                  if (onClose) onClose();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="p-1.5 text-[#556B2F] hover:text-[#800020] rounded-lg hover:bg-[#F4F1E8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{navContent}</div>
          </div>
        </div>
      )}
    </>
  );
};
