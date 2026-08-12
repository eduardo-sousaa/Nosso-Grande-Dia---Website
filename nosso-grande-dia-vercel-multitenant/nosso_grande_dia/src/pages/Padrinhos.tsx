import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Sparkles, FileText, Check, User } from 'lucide-react';
import { ParticipanteCerimonia, Convidado } from '../types';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';

export const Padrinhos: React.FC = () => {
  const { primaryColor } = useTheme();

  const [participantes, setParticipantes] = useState<(ParticipanteCerimonia & { convidado: Convidado | null })[]>([]);
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [tipo, setTipo] = useState<'PADRINHO' | 'MADRINHA'>('PADRINHO');
  const [addMode, setAddMode] = useState<'NOVO_NOME' | 'CONVIDADO_EXISTENTE'>('NOVO_NOME');
  const [nomeDireto, setNomeDireto] = useState('');
  const [selectedConvidadoId, setSelectedConvidadoId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tracking saving status for inline observations
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPadrinhos();
      setParticipantes(data.participantes);
      setConvidados(data.convidados);
      if (data.convidados.length > 0) {
        setSelectedConvidadoId(data.convidados[0].id);
      }
    } catch (err) {
      console.error('Failed to load ceremony participants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPadrinho = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      if (addMode === 'NOVO_NOME') {
        if (!nomeDireto.trim()) {
          setModalError('Por favor, informe o nome.');
          setSubmitting(false);
          return;
        }
        await api.addPadrinho({
          nome: nomeDireto.trim(),
          tipo,
          status_convite: 'NAO_ENVIADO',
          confirmado: true,
          observacao: observacao.trim()
        });
      } else {
        if (!selectedConvidadoId) {
          setModalError('Selecione um convidado.');
          setSubmitting(false);
          return;
        }
        await api.addPadrinho({
          convidado_id: selectedConvidadoId,
          tipo,
          status_convite: 'NAO_ENVIADO',
          confirmado: true,
          observacao: observacao.trim()
        });
      }

      // Reset form
      setNomeDireto('');
      setObservacao('');
      setModalError('');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Erro ao adicionar.');
    } finally {
      setSubmitting(false);
    }
  };

  // State for delete confirmation modal
  const [itemToDelete, setItemToDelete] = useState<{ id: string; nome: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeletePadrinho = (id: string, nome: string) => {
    setItemToDelete({ id, nome });
  };

  const confirmDeletePadrinho = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await api.deletePadrinho(itemToDelete.id);
      setItemToDelete(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete participant:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateObservation = async (id: string, newObservacao: string) => {
    setSavingId(id);
    try {
      await api.updatePadrinho(id, { observacao: newObservacao });
      setParticipantes(prev =>
        prev.map(p => (p.id === id ? { ...p, observacao: newObservacao } : p))
      );
    } catch (err) {
      console.error('Failed to update observation:', err);
    } finally {
      setTimeout(() => setSavingId(null), 600);
    }
  };

  const padrinhos = participantes.filter(p => p.tipo === 'PADRINHO');
  const madrinhas = participantes.filter(p => p.tipo === 'MADRINHA');

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E5E2D9] shadow-xs">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2D2D2D]">Padrinhos & Madrinhas</h2>
          <p className="text-xs text-stone-500 mt-1">
            Organize os padrinhos e madrinhas do seu casamento e adicione observações para cada um.
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            if (convidados.length > 0 && !selectedConvidadoId) {
              setSelectedConvidadoId(convidados[0].id);
            }
          }}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
          style={{ backgroundColor: primaryColor }}
        >
          <UserPlus className="w-4 h-4" />
          <span>Adicionar Padrinho / Madrinha</span>
        </button>
      </div>

      {/* Main Lists Grid (Padrinhos vs Madrinhas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LISTA DE PADRINHOS */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F4F1E8] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] border border-[#E5E2D9] flex items-center justify-center text-xl">
                🤵
              </div>
              <div>
                <h3 className="font-serif font-bold text-[#2D2D2D] text-lg">Lista de Padrinhos</h3>
                <p className="text-xs text-stone-500">Padrinhos escolhidos para a cerimônia</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#FAF6F0] text-[#800020] font-bold text-xs rounded-full border border-[#E5E2D9]">
              {padrinhos.length} {padrinhos.length === 1 ? 'padrinho' : 'padrinhos'}
            </span>
          </div>

          {padrinhos.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E5E2D9] space-y-2">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400 text-xl">
                🤵
              </div>
              <p className="text-xs font-semibold text-stone-600">Nenhum padrinho cadastrado ainda</p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                Clique no botão acima para adicionar padrinhos à lista com suas respectivas observações.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {padrinhos.map(p => {
                const name = p.convidado ? `${p.convidado.nome} ${p.convidado.sobrenome || ''}`.trim() : 'Padrinho';
                return (
                  <div
                    key={p.id}
                    className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E2D9] shadow-2xs space-y-3 hover:border-stone-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#800020]/10 text-[#800020] font-serif font-bold text-sm flex items-center justify-center shrink-0 border border-[#800020]/20">
                          {name[0] || 'P'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#2D2D2D] truncate">{name}</h4>
                          <span className="inline-block text-[10px] font-semibold text-[#556B2F] bg-[#556B2F]/10 px-2 py-0.5 rounded-md">
                            Padrinho
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeletePadrinho(p.id, name)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                        title="Remover da lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Espaço para Observação */}
                    <div className="pt-2 border-t border-[#E5E2D9]/60">
                      <label className="block text-[11px] font-semibold text-stone-500 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-[#556B2F]" />
                          Observação:
                        </span>
                        {savingId === p.id && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-fade-in">
                            <Check className="w-3 h-3" /> Salvo!
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        defaultValue={p.observacao || ''}
                        onBlur={e => handleUpdateObservation(p.id, e.target.value)}
                        placeholder="Adicione uma observação (ex: Terno cinza, padrinho do noivo, traje, presente...)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E2D9] bg-white focus:bg-white focus:ring-2 focus:ring-[#800020] focus:outline-none transition-all placeholder:text-stone-300 text-stone-800"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LISTA DE MADRINHAS */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F4F1E8] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] border border-[#E5E2D9] flex items-center justify-center text-xl">
                👰
              </div>
              <div>
                <h3 className="font-serif font-bold text-[#2D2D2D] text-lg">Lista de Madrinhas</h3>
                <p className="text-xs text-stone-500">Madrinhas escolhidas para a cerimônia</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#FAF6F0] text-[#800020] font-bold text-xs rounded-full border border-[#E5E2D9]">
              {madrinhas.length} {madrinhas.length === 1 ? 'madrinha' : 'madrinhas'}
            </span>
          </div>

          {madrinhas.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E5E2D9] space-y-2">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400 text-xl">
                👰
              </div>
              <p className="text-xs font-semibold text-stone-600">Nenhuma madrinha cadastrada ainda</p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                Clique no botão acima para adicionar madrinhas à lista com suas respectivas observações.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {madrinhas.map(p => {
                const name = p.convidado ? `${p.convidado.nome} ${p.convidado.sobrenome || ''}`.trim() : 'Madrinha';
                return (
                  <div
                    key={p.id}
                    className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E2D9] shadow-2xs space-y-3 hover:border-stone-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#800020]/10 text-[#800020] font-serif font-bold text-sm flex items-center justify-center shrink-0 border border-[#800020]/20">
                          {name[0] || 'M'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#2D2D2D] truncate">{name}</h4>
                          <span className="inline-block text-[10px] font-semibold text-[#800020] bg-[#800020]/10 px-2 py-0.5 rounded-md">
                            Madrinha
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeletePadrinho(p.id, name)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                        title="Remover da lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Espaço para Observação */}
                    <div className="pt-2 border-t border-[#E5E2D9]/60">
                      <label className="block text-[11px] font-semibold text-stone-500 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-[#556B2F]" />
                          Observação:
                        </span>
                        {savingId === p.id && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-fade-in">
                            <Check className="w-3 h-3" /> Salvo!
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        defaultValue={p.observacao || ''}
                        onBlur={e => handleUpdateObservation(p.id, e.target.value)}
                        placeholder="Adicione uma observação (ex: Cor do vestido rosé, buquê, convidada da família...)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E2D9] bg-white focus:bg-white focus:ring-2 focus:ring-[#800020] focus:outline-none transition-all placeholder:text-stone-300 text-stone-800"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modal para Adicionar Padrinho ou Madrinha */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setModalError(''); }} title="Adicionar Padrinho ou Madrinha">
        <form onSubmit={handleAddPadrinho} className="space-y-5">
          
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700">
              {modalError}
            </div>
          )}

          {/* Seleção do Papel (Padrinho ou Madrinha) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">Selecione o Papel *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('PADRINHO')}
                className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  tipo === 'PADRINHO'
                    ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span className="text-base">🤵</span>
                <span>Padrinho</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('MADRINHA')}
                className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  tipo === 'MADRINHA'
                    ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span className="text-base">👰</span>
                <span>Madrinha</span>
              </button>
            </div>
          </div>

          {/* Formato de Inclusão: Digitar Nome ou Selecionar Convidado Existente */}
          {convidados.length > 0 && (
            <div className="flex bg-[#F4F1E8] p-1 rounded-xl border border-[#E5E2D9] text-xs font-medium">
              <button
                type="button"
                onClick={() => setAddMode('NOVO_NOME')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  addMode === 'NOVO_NOME' ? 'bg-white text-[#2D2D2D] font-bold shadow-2xs' : 'text-stone-500'
                }`}
              >
                Digitar Nome
              </button>
              <button
                type="button"
                onClick={() => setAddMode('CONVIDADO_EXISTENTE')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  addMode === 'CONVIDADO_EXISTENTE' ? 'bg-white text-[#2D2D2D] font-bold shadow-2xs' : 'text-stone-500'
                }`}
              >
                Selecionar dos Convidados
              </button>
            </div>
          )}

          {/* Input do Nome ou Dropdown */}
          {addMode === 'NOVO_NOME' || convidados.length === 0 ? (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nome do {tipo === 'PADRINHO' ? 'Padrinho' : 'Madrinha'} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={`Ex: ${tipo === 'PADRINHO' ? 'Carlos Eduardo' : 'Juliana Silva'}`}
                  value={nomeDireto}
                  onChange={e => setNomeDireto(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#800020] focus:outline-none bg-stone-50/50"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Selecione o Convidado *</label>
              <select
                required
                value={selectedConvidadoId}
                onChange={e => setSelectedConvidadoId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#800020] focus:outline-none bg-white"
              >
                {convidados.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.nome} {g.sobrenome || ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Observação / Notas */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Observação / Anotação (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: Cor do traje/vestido, amigo de infância, parente..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#800020] focus:outline-none bg-stone-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {submitting ? 'Adicionando...' : `Adicionar ${tipo === 'PADRINHO' ? 'Padrinho' : 'Madrinha'} à Lista`}
          </button>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Confirmar Remoção">
        <div className="space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed">
            Tem certeza que deseja remover <strong>{itemToDelete?.nome}</strong> da lista?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setItemToDelete(null)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={confirmDeletePadrinho}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors disabled:opacity-50"
            >
              {deleting ? 'Removendo...' : 'Sim, Remover'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
