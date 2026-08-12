import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Trash2, Edit2, CheckCircle2, Clock, XCircle, Phone, Mail, UserPlus } from 'lucide-react';
import { Convidado, GrupoConvidado } from '../types';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';

export const Convidados: React.FC = () => {
  const { primaryColor } = useTheme();

  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [grupos, setGrupos] = useState<GrupoConvidado[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [grupoFilter, setGrupoFilter] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState('');

  // Modals
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Guest Form
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [conviteStatus, setConviteStatus] = useState<'NAO_ENVIADO' | 'ENVIADO'>('NAO_ENVIADO');
  const [confirmacao, setConfirmacao] = useState<'AGUARDANDO' | 'CONFIRMADO' | 'RECUSADO'>('AGUARDANDO');
  const [acompanhante, setAcompanhante] = useState(0);
  const [observacao, setObservacao] = useState('');

  // Group Form
  const [groupName, setGroupName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getConvidados();
      setConvidados(data.convidados);
      setGrupos(data.grupos);
      if (data.grupos.length > 0) setGrupoId(data.grupos[0].id);
    } catch (err) {
      console.error('Failed to load guests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createConvidado({
        nome,
        sobrenome,
        telefone,
        email,
        grupo_id: grupoId || undefined,
        convite_status: conviteStatus,
        confirmacao,
        acompanhante: Number(acompanhante),
        observacao
      });
      setNome('');
      setSobrenome('');
      setTelefone('');
      setEmail('');
      setAcompanhante(0);
      setObservacao('');
      setIsGuestModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Guest creation failed:', err);
    }
  };

  const handleUpdateRSVP = async (id: string, status: 'AGUARDANDO' | 'CONFIRMADO' | 'RECUSADO') => {
    try {
      await api.updateConvidado(id, { confirmacao: status });
      loadData();
    } catch (err) {
      console.error('RSVP update failed:', err);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    try {
      await api.deleteConvidado(id);
      loadData();
    } catch (err) {
      console.error('Guest deletion failed:', err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      await api.createGrupoConvidado(groupName.trim());
      setGroupName('');
      setIsGroupModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Group creation failed:', err);
    }
  };

  // Calculations
  const totalConfirmados = convidados
    .filter(g => g.confirmacao === 'CONFIRMADO')
    .reduce((acc, curr) => acc + 1 + (curr.acompanhante || 0), 0);

  const totalAguardando = convidados
    .filter(g => g.confirmacao === 'AGUARDANDO')
    .reduce((acc, curr) => acc + 1 + (curr.acompanhante || 0), 0);

  const totalRecusados = convidados
    .filter(g => g.confirmacao === 'RECUSADO')
    .reduce((acc, curr) => acc + 1 + (curr.acompanhante || 0), 0);

  const totalPessoas = convidados.reduce((acc, curr) => acc + 1 + (curr.acompanhante || 0), 0);

  // Filtered List
  const filtered = convidados.filter(g => {
    const fullName = `${g.nome} ${g.sobrenome || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase());
    const matchesGrupo = !grupoFilter || g.grupo_id === grupoFilter;
    const matchesRSVP = !rsvpFilter || g.confirmacao === rsvpFilter;
    return matchesSearch && matchesGrupo && matchesRSVP;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Lista de Convidados</h2>
          <p className="text-xs text-stone-500">Organize os convites e acompanhe as confirmações de presença (RSVP)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
          >
            + Grupo Customizado
          </button>
          <button
            onClick={() => setIsGuestModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 flex items-center gap-1.5"
            style={{ backgroundColor: primaryColor }}
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Convidado
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-xs text-stone-500 font-medium">Total de Pessoas</p>
          <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{totalPessoas}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">{convidados.length} convites titulares</p>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 shadow-2xs">
          <p className="text-xs text-emerald-800 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmados
          </p>
          <p className="text-2xl font-serif font-bold text-emerald-900 mt-1">{totalConfirmados}</p>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 shadow-2xs">
          <p className="text-xs text-amber-800 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Aguardando
          </p>
          <p className="text-2xl font-serif font-bold text-amber-900 mt-1">{totalAguardando}</p>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-100 shadow-2xs">
          <p className="text-xs text-rose-800 font-medium flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            Recusados
          </p>
          <p className="text-2xl font-serif font-bold text-rose-900 mt-1">{totalRecusados}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-marsala"
          />
        </div>

        <select
          value={grupoFilter}
          onChange={e => setGrupoFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-marsala bg-white"
        >
          <option value="">Todos os grupos</option>
          {grupos.map(g => (
            <option key={g.id} value={g.id}>{g.nome}</option>
          ))}
        </select>

        <select
          value={rsvpFilter}
          onChange={e => setRsvpFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-marsala bg-white"
        >
          <option value="">Todas as confirmações</option>
          <option value="CONFIRMADO">Confirmados</option>
          <option value="AGUARDANDO">Aguardando RSVP</option>
          <option value="RECUSADO">Recusados</option>
        </select>
      </div>

      {/* Guests Table / Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-medium text-stone-600">Nenhum convidado encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered.map(guest => {
              const grupo = grupos.find(g => g.id === guest.grupo_id);

              return (
                <div key={guest.id} className="p-4 hover:bg-stone-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-stone-900">
                        {guest.nome} {guest.sobrenome}
                      </h4>
                      {guest.acompanhante > 0 && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                          +{guest.acompanhante} acompanhante(s)
                        </span>
                      )}
                      {grupo && (
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                          {grupo.nome}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-500">
                      {guest.telefone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          {guest.telefone}
                        </span>
                      )}
                      {guest.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-stone-400" />
                          {guest.email}
                        </span>
                      )}
                    </div>

                    {guest.observacao && (
                      <p className="text-xs text-stone-500 italic mt-0.5">{guest.observacao}</p>
                    )}
                  </div>

                  {/* Right Actions & Status Toggle */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <select
                      value={guest.confirmacao}
                      onChange={e => handleUpdateRSVP(guest.id, e.target.value as any)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none ${
                        guest.confirmacao === 'CONFIRMADO'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : guest.confirmacao === 'RECUSADO'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <option value="AGUARDANDO">⏳ Aguardando</option>
                      <option value="CONFIRMADO">✅ Confirmado</option>
                      <option value="RECUSADO">❌ Recusado</option>
                    </select>

                    <button
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="text-stone-300 hover:text-rose-600 p-1 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guest Modal */}
      <Modal isOpen={isGuestModalOpen} onClose={() => setIsGuestModalOpen(false)} title="Cadastrar Convidado">
        <form onSubmit={handleCreateGuest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nome *</label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Sobrenome</label>
              <input
                type="text"
                placeholder="Ex: Silva"
                value={sobrenome}
                onChange={e => setSobrenome(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Grupo do Convidado</label>
              <select
                value={grupoId}
                onChange={e => setGrupoId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala bg-white"
              >
                {grupos.map(g => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Acompanhantes extra (+N)</label>
              <input
                type="number"
                min="0"
                value={acompanhante}
                onChange={e => setAcompanhante(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Status da Confirmação</label>
              <select
                value={confirmacao}
                onChange={e => setConfirmacao(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala bg-white"
              >
                <option value="AGUARDANDO">Aguardando</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="RECUSADO">Recusado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Observação</label>
            <input
              type="text"
              placeholder="Ex: Restrição alimentar a lactose, padrinho, etc."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Cadastrar Convidado
          </button>
        </form>
      </Modal>

      {/* Group Modal */}
      <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Novo Grupo de Convidados">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Grupo *</label>
            <input
              type="text"
              required
              placeholder="Ex: Amigos da Faculdade"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Criar Grupo
          </button>
        </form>
      </Modal>

    </div>
  );
};
