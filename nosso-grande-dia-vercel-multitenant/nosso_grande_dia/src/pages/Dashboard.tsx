import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Users,
  DollarSign,
  Heart,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Bell,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ResumoDashboard } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  onOpenSetup?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, setActiveTab, onOpenSetup }) => {
  const { casamento } = useAuth();
  const { primaryColor } = useTheme();
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = (page: string) => {
    if (onNavigate) onNavigate(page);
    if (setActiveTab) setActiveTab(page);
  };

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setResumo(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [casamento]);

  if (loading) {
    return (
      <div className="p-12 text-center text-[#556B2F] font-medium animate-pulse flex flex-col items-center justify-center min-h-[300px]">
        <span className="text-3xl mb-2 font-serif italic">Carregando o grande dia...</span>
      </div>
    );
  }

  if (!casamento) {
    return (
      <div className="p-10 text-center bg-white rounded-3xl shadow-sm border border-[#E5E2D9] max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-full border-2 border-[#800020] mx-auto p-1 flex items-center justify-center bg-[#FDFCF8]">
          <Heart className="w-8 h-8 text-[#800020]" />
        </div>
        <h2 className="text-3xl font-serif italic font-bold text-[#800020]">Bem-vindo ao Nosso Grande Dia</h2>
        <p className="text-xs text-[#556B2F] font-medium uppercase tracking-wider">Nenhum casamento configurado ainda</p>
        <button
          onClick={onOpenSetup}
          className="px-6 py-3 rounded-xl bg-[#800020] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#92142E] transition-all"
        >
          Configurar Nosso Casamento
        </button>
      </div>
    );
  }

  const {
    dias_restantes,
    progresso_planejamento,
    tarefas_pendentes,
    tarefas_atrasadas,
    decisoes_pendentes,
    decisoes_concluidas,
    total_convidados,
    total_padrinhos_madrinhas,
    resumo_financeiro,
    proximos_eventos,
    alertas
  } = resumo || {
    dias_restantes: null,
    progresso_planejamento: 0,
    tarefas_pendentes: 0,
    tarefas_atrasadas: 0,
    decisoes_pendentes: 0,
    decisoes_concluidas: 0,
    total_convidados: 0,
    total_padrinhos_madrinhas: 0,
    resumo_financeiro: { total_planejado: 0, total_contratado: 0, total_pago: 0, total_restante: 0 },
    proximos_eventos: [],
    alertas: []
  };

  const formatDateBR = (dateStr: string | null) => {
    if (!dateStr) return 'Data a definir';
    const [year, month, day] = dateStr.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header: Artistic Flair Style */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#E5E2D9] pb-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif italic text-[#800020] mb-2 leading-tight">
            {casamento.nome_noivo} & {casamento.nome_noiva}
          </h2>
          <p className="text-[#556B2F] tracking-[0.2em] uppercase text-xs font-semibold flex items-center">
            <span className="w-12 h-[1px] bg-[#556B2F] mr-3"></span>
            {formatDateBR(casamento.data_casamento)}
            {casamento.local ? ` • ${casamento.local}` : ''}
          </p>
        </div>

        <div className="text-left md:text-right bg-[#F4F1E8] px-6 py-3 rounded-2xl border border-[#E5E2D9]">
          <div className="text-3xl md:text-4xl font-serif font-light text-[#2D2D2D]">
            {dias_restantes !== null ? (
              <>
                {dias_restantes} <span className="text-lg italic opacity-60">dias</span>
              </>
            ) : (
              <span className="text-xl italic text-[#800020]">A definir</span>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-[#556B2F] font-bold">
            Contagem Regressiva
          </p>
        </div>
      </header>

      {/* Alerts if any */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest font-bold text-[#556B2F]">
            Alertas Importantes
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alertas.map(alt => (
              <div
                key={alt.id}
                onClick={() => alt.link && navigate(alt.link.replace('/', ''))}
                className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer hover:shadow-sm transition-all ${
                  alt.nivel === 'URGENTE'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-[#F4F1E8] border-[#E5E2D9] text-[#2D2D2D]'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  alt.nivel === 'URGENTE' ? 'text-rose-600' : 'text-[#800020]'
                }`} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold leading-tight uppercase tracking-wide">{alt.titulo}</h4>
                  <p className="text-xs mt-0.5 opacity-90">{alt.mensagem}</p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-50 self-center" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid Layout (Artistic Flair Archetype) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Progress Card (Col 8) */}
        <div className="md:col-span-8 bg-white rounded-3xl p-8 border border-[#E5E2D9] flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#556B2F]">Progresso do Sonho</h3>
            <span className="bg-[#F4F1E8] px-3.5 py-1 rounded-full text-[#556B2F] text-xs font-bold border border-[#E5E2D9]">
              {progresso_planejamento}% Concluído
            </span>
          </div>

          <div className="space-y-4">
            <div className="w-full bg-[#F4F1E8] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#E5E2D9]">
              <div
                className="bg-[#800020] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(progresso_planejamento, 5)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-medium text-[#556B2F] italic">
              <span>Início do Plano</span>
              <span>Contratação de Fornecedores</span>
              <span>O Grande Dia</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-[#F4F1E8]">
            <div>
              <p className="text-[10px] uppercase font-bold text-[#556B2F]">Tarefas Pendentes</p>
              <p className="text-2xl font-serif font-bold text-[#800020] mt-0.5">{tarefas_pendentes}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#556B2F]">Decisões Tomadas</p>
              <p className="text-2xl font-serif font-bold text-[#2D2D2D] mt-0.5">{decisoes_concluidas}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#556B2F]">Atrasadas</p>
              <p className="text-2xl font-serif font-bold text-rose-700 mt-0.5">{tarefas_atrasadas}</p>
            </div>
          </div>
        </div>

        {/* Marsala Financial Summary Box (Col 4) */}
        <div className="md:col-span-4 bg-[#800020] rounded-3xl p-8 text-white flex flex-col justify-between shadow-md">
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold opacity-75 mb-6 text-amber-100">Resumo Financeiro</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">Total Planejado</p>
                <p className="text-3xl font-serif tracking-tight font-normal">
                  {formatCurrency(resumo_financeiro.total_planejado)}
                </p>
              </div>
              <div className="h-[1px] bg-white opacity-20" />
              <div>
                <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">Total Pago</p>
                <p className="text-2xl font-serif tracking-tight text-amber-200">
                  {formatCurrency(resumo_financeiro.total_pago)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#92142E] p-4 rounded-2xl mt-6">
            <p className="text-[10px] uppercase font-bold opacity-80 text-amber-100">Restante A Pagar</p>
            <p className="text-base font-serif font-bold text-white">
              {formatCurrency(resumo_financeiro.total_restante)}
            </p>
            <button
              onClick={() => navigate('orcamento')}
              className="mt-2 text-[10px] uppercase font-bold text-amber-200 hover:text-white flex items-center gap-1 transition-colors"
            >
              Ver Orçamento Detalhado <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Next Tasks Card (Col 6) */}
        <div className="md:col-span-6 bg-white rounded-3xl p-8 border border-[#E5E2D9] flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs uppercase tracking-widest font-bold text-[#556B2F]">Próximas Atividades</h3>
              <button
                onClick={() => navigate('planejamento')}
                className="text-xs font-serif italic text-[#800020] font-bold hover:underline"
              >
                Ver tudo →
              </button>
            </div>

            {proximos_eventos.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#556B2F] italic">
                Nenhum compromisso pendente nos próximos dias.
              </div>
            ) : (
              <div className="space-y-4">
                {proximos_eventos.slice(0, 3).map(evt => (
                  <div key={evt.id} className="flex items-start space-x-4 border-b border-[#F4F1E8] pb-4 last:border-0 last:pb-0">
                    <div className="w-5 h-5 rounded border-2 border-[#800020] mt-0.5 shrink-0 bg-[#FDFCF8]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2D2D2D] leading-tight truncate">{evt.titulo}</p>
                      <p className="text-[10px] text-[#800020] font-bold uppercase tracking-wider mt-1">
                        {evt.tipo} • {evt.data_inicio}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('planejamento')}
            className="w-full mt-6 py-3 border border-dashed border-[#E5E2D9] rounded-xl text-xs font-bold text-[#556B2F] uppercase hover:bg-[#F4F1E8] transition-all"
          >
            + Acessar Painel de Tarefas
          </button>
        </div>

        {/* Guest Summary Card (Col 6) */}
        <div className="md:col-span-6 bg-white rounded-3xl p-8 border border-[#E5E2D9] flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs uppercase tracking-widest font-bold text-[#556B2F]">Lista de Convidados</h3>
              <button
                onClick={() => navigate('convidados')}
                className="text-xs font-serif italic text-[#800020] font-bold hover:underline"
              >
                Gerenciar Lista →
              </button>
            </div>

            <div className="flex items-center justify-around py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-[#F4F1E8]"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-[#556B2F]"
                    strokeWidth="3.5"
                    strokeDasharray="65, 100"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-serif font-bold text-[#2D2D2D]">{total_convidados}</span>
                  <span className="text-[9px] uppercase tracking-wider text-[#556B2F] font-bold">Total</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#556B2F]" />
                  <span className="text-xs text-[#2D2D2D] font-medium">Convidados Geral ({total_convidados})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
                  <span className="text-xs text-[#800020] font-bold">Padrinhos & Madrinhas ({total_padrinhos_madrinhas})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Decisions Pill Banner */}
          <div
            onClick={() => navigate('planejamento')}
            className="mt-6 bg-[#F4F1E8] rounded-2xl px-6 py-3.5 flex items-center justify-between border border-[#E5E2D9] cursor-pointer hover:bg-[#E5E2D9]/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">🤔</span>
              <span className="text-xs font-bold text-[#556B2F] uppercase">
                {decisoes_pendentes} Decisões Pendentes
              </span>
            </div>
            <span className="text-[#800020] text-xs font-serif italic font-bold">Ver agora →</span>
          </div>
        </div>

      </div>

    </div>
  );
};
