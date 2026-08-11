import React, { useState } from 'react';
import { Heart, Sparkles, Calendar, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface FirstAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FirstAccessModal: React.FC<FirstAccessModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { casamento, refreshCasamento } = useAuth();
  const { primaryColor } = useTheme();

  const [nomeNoivo, setNomeNoivo] = useState(casamento?.nome_noivo || '');
  const [nomeNoiva, setNomeNoiva] = useState(casamento?.nome_noiva || '');
  const [dataCasamento, setDataCasamento] = useState(casamento?.data_casamento || '');
  const [local, setLocal] = useState(casamento?.local || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (casamento) {
      if (casamento.nome_noivo) setNomeNoivo(casamento.nome_noivo);
      if (casamento.nome_noiva) setNomeNoiva(casamento.nome_noiva);
      if (casamento.data_casamento) setDataCasamento(casamento.data_casamento);
      if (casamento.local) setLocal(casamento.local);
    }
  }, [casamento]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.setupCasamento({
        nome_noivo: nomeNoivo,
        nome_noiva: nomeNoiva,
        data_casamento: dataCasamento || undefined,
        local: local || undefined
      });
      await refreshCasamento();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Setup failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200/80 w-full max-w-md overflow-hidden text-center p-6 md:p-8 space-y-6">
        
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-white shadow-md animate-bounce"
          style={{ backgroundColor: primaryColor }}
        >
          <Heart className="w-8 h-8 fill-white/20" />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-800 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
            💍 Nosso Grande Dia
          </span>
          <h2 className="text-2xl font-serif font-bold text-stone-900 mt-3">
            Vamos começar a organizar nosso casamento? ❤️
          </h2>
          <p className="text-xs text-stone-500 mt-2">
            Insira os nomes do casal e, se já souberem, a data e o local. Você pode alterar tudo depois!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="text-left space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Noivo *</label>
              <input
                type="text"
                required
                value={nomeNoivo}
                onChange={e => setNomeNoivo(e.target.value)}
                placeholder="Ex: Eduardo"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-marsala"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nome da Noiva *</label>
              <input
                type="text"
                required
                value={nomeNoiva}
                onChange={e => setNomeNoiva(e.target.value)}
                placeholder="Ex: Maria"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-marsala"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              Data do Casamento (Opcional)
            </label>
            <input
              type="date"
              value={dataCasamento}
              onChange={e => setDataCasamento(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-marsala"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              Local da Cerimônia / Festa (Opcional)
            </label>
            <input
              type="text"
              value={local}
              onChange={e => setLocal(e.target.value)}
              placeholder="Ex: Quinta das Flores"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-marsala"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-medium shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm mt-4"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Configurando...' : 'Configurar Casamento'}
          </button>
        </form>

      </div>
    </div>
  );
};
