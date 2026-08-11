import React, { useState } from 'react';
import { Heart, Menu, Settings, User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
  currentPage?: string;
  activeTab?: string;
  onNavigate?: (page: string) => void;
  setActiveTab?: (tab: string) => void;
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  activeTab,
  onNavigate,
  setActiveTab,
  onToggleSidebar,
  onOpenMobileMenu
}) => {
  const { user, casamento, logout } = useAuth();
  const { primaryColor } = useTheme();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navigate = (page: string) => {
    if (onNavigate) onNavigate(page);
    if (setActiveTab) setActiveTab(page);
  };

  const toggleMobile = () => {
    if (onToggleSidebar) onToggleSidebar();
    if (onOpenMobileMenu) onOpenMobileMenu();
  };

  const groomInitial = casamento?.nome_noivo?.[0] || user?.nome_noivo?.[0] || 'N';
  const brideInitial = casamento?.nome_noiva?.[0] || user?.nome_noiva?.[0] || 'N';
  const coupleTitle = casamento?.nome_noivo && casamento?.nome_noiva
    ? `${casamento.nome_noivo} & ${casamento.nome_noiva}`
    : user?.nome_noivo && user?.nome_noiva
    ? `${user.nome_noivo} & ${user.nome_noiva}`
    : user?.nome || 'Nosso Casamento';

  return (
    <header className="sticky top-0 z-30 bg-[#FDFCF8]/95 backdrop-blur-md border-b border-[#E5E2D9] px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Mobile Toggle & Couple Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobile}
            className="md:hidden p-2 text-[#556B2F] hover:text-[#800020] rounded-xl hover:bg-[#F4F1E8] transition-colors"
            title="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-full border-2 border-[#800020] bg-white p-0.5 flex items-center justify-center overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
              <span className="text-[#800020] font-serif text-base italic font-bold">
                {groomInitial}&{brideInitial}
              </span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-serif italic font-bold text-[#800020] leading-none flex items-center gap-2">
                {coupleTitle}
              </h1>
              <p className="text-[10px] md:text-xs text-[#556B2F] tracking-[0.15em] uppercase font-semibold mt-0.5">
                Nosso Grande Dia
              </p>
            </div>
          </div>
        </div>

        {/* Right: Couple Account & Settings */}
        <div className="flex items-center gap-3">
          
          {/* User Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E2D9] bg-white hover:bg-[#F4F1E8] transition-all text-xs text-[#2D2D2D] font-medium shadow-2xs"
            >
              {user?.foto ? (
                <img src={user.foto} alt={user.nome} className="w-6 h-6 rounded-full object-cover border border-[#800020]" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#800020] text-white flex items-center justify-center text-[10px] font-bold">
                  {groomInitial}{brideInitial}
                </div>
              )}
              <span className="hidden sm:inline font-semibold">{user?.nome || coupleTitle}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#556B2F]" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#E5E2D9] py-2 z-50 text-xs">
                <div className="px-4 py-2.5 border-b border-[#F4F1E8]">
                  <p className="text-[10px] font-bold text-[#556B2F] uppercase tracking-wider">Conta do Casal</p>
                  <p className="text-xs font-bold text-[#2D2D2D] mt-0.5 truncate">{user?.nome || coupleTitle}</p>
                  <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate('configuracoes');
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-[#2D2D2D] hover:bg-[#F4F1E8] flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#556B2F]" />
                    Configurações do Casamento
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    Sair da Conta
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings button */}
          <button
            onClick={() => navigate('configuracoes')}
            className="p-2 text-[#556B2F] hover:text-[#800020] rounded-xl hover:bg-[#F4F1E8] transition-colors"
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </button>

        </div>

      </div>
    </header>
  );
};
