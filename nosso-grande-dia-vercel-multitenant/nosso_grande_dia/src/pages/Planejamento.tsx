import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  HelpCircle,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Check,
  Clock,
  User,
  AlertCircle,
  Heart
} from 'lucide-react';
import { Tarefa, CategoriaTarefa, Decisao, EventoCronograma } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';

interface PlanejamentoProps {
  initialSubTab?: 'tarefas' | 'decisoes' | 'cronograma';
}

export const Planejamento: React.FC<PlanejamentoProps> = ({ initialSubTab = 'tarefas' }) => {
  const { user, casamento } = useAuth();
  const { primaryColor } = useTheme();

  const [subTab, setSubTab] = useState<'tarefas' | 'decisoes' | 'cronograma'>(initialSubTab);

  // Data states
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [categoriasTarefa, setCategoriasTarefa] = useState<CategoriaTarefa[]>([]);
  const [decisoes, setDecisoes] = useState<Decisao[]>([]);
  const [cronograma, setCronograma] = useState<EventoCronograma[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Form states
  const [newTitulo, setNewTitulo] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [newResp, setNewResp] = useState('');
  const [newPrazo, setNewPrazo] = useState('');
  const [newPrioridade, setNewPrioridade] = useState<'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'>('MEDIA');
  const [newCatName, setNewCatName] = useState('');

  // Decision form state
  const [decTitulo, setDecTitulo] = useState('');
  const [decDesc, setDecDesc] = useState('');

  // Event form state
  const [evtTitulo, setEvtTitulo] = useState('');
  const [evtDesc, setEvtDesc] = useState('');
  const [evtDataInicio, setEvtDataInicio] = useState('');
  const [evtTipo, setEvtTipo] = useState<'EVENTO' | 'PRAZO' | 'COMPROMISSO'>('EVENTO');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, dData, cData] = await Promise.all([
        api.getTarefas(),
        api.getDecisoes(),
        api.getCronograma()
      ]);
      setTarefas(tData.tarefas);
      setCategoriasTarefa(tData.categorias);
      if (tData.categorias.length > 0) setNewCatId(tData.categorias[0].id);
      setDecisoes(dData);
      setCronograma(cData);
    } catch (err) {
      console.error('Failed to load planning data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for Tasks
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTarefa({
        titulo: newTitulo,
        descricao: newDesc,
        categoria_id: newCatId || categoriasTarefa[0]?.id || 'cat_tar_10',
        responsavel_id: newResp || undefined,
        prazo: newPrazo || undefined,
        prioridade: newPrioridade,
        status: 'PENDENTE',
        criado_por: user?.id || 'usr_noivo_1'
      });
      setNewTitulo('');
      setNewDesc('');
      setIsTaskModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Task creation failed:', err);
    }
  };

  const handleToggleTaskStatus = async (task: Tarefa) => {
    const nextStatus = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
    try {
      await api.updateTarefa(task.id, { status: nextStatus });
      loadData();
    } catch (err) {
      console.error('Task toggle failed:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTarefa(id);
      loadData();
    } catch (err) {
      console.error('Task deletion failed:', err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.createCategoriaTarefa(newCatName.trim());
      setNewCatName('');
      setIsCatModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Category creation failed:', err);
    }
  };

  // Handlers for Decisions
  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDecisao({
        titulo: decTitulo,
        descricao: decDesc,
        status: 'PENDENTE',
        criado_por: user?.id || 'usr_noivo_1'
      });
      setDecTitulo('');
      setDecDesc('');
      setIsDecisionModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Decision creation failed:', err);
    }
  };

  const handleToggleDecision = async (dec: Decisao) => {
    const nextStatus = dec.status === 'DECIDIDA' ? 'PENDENTE' : 'DECIDIDA';
    try {
      await api.updateDecisao(dec.id, { status: nextStatus });
      loadData();
    } catch (err) {
      console.error('Decision toggle failed:', err);
    }
  };

  const handleDeleteDecision = async (id: string) => {
    try {
      await api.deleteDecisao(id);
      loadData();
    } catch (err) {
      console.error('Decision delete failed:', err);
    }
  };

  // Handlers for Cronograma
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEventoCronograma({
        titulo: evtTitulo,
        descricao: evtDesc,
        data_inicio: evtDataInicio,
        tipo: evtTipo,
        criado_por: user?.id || 'usr_noivo_1'
      });
      setEvtTitulo('');
      setEvtDesc('');
      setEvtDataInicio('');
      setIsEventModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Event creation failed:', err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await api.deleteEventoCronograma(id);
      loadData();
    } catch (err) {
      console.error('Event delete failed:', err);
    }
  };

  // Filtered Tasks
  const filteredTarefas = tarefas.filter(t => {
    const matchesSearch = t.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (t.descricao && t.descricao.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = !catFilter || t.categoria_id === catFilter;
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Subtabs Header Navigation */}
      <div className="flex items-center justify-between border-b border-[#E5E2D9] pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('tarefas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'tarefas'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'bg-white text-[#2D2D2D] hover:bg-[#F4F1E8] border border-[#E5E2D9]'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-[#556B2F]" />
            Tarefas
          </button>
          <button
            onClick={() => setSubTab('decisoes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'decisoes'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'bg-white text-[#2D2D2D] hover:bg-[#F4F1E8] border border-[#E5E2D9]'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-[#556B2F]" />
            Decisões
          </button>
          <button
            onClick={() => setSubTab('cronograma')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'cronograma'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'bg-white text-[#2D2D2D] hover:bg-[#F4F1E8] border border-[#E5E2D9]'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-[#556B2F]" />
            Cronograma
          </button>
        </div>

        {subTab === 'tarefas' && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            >
              + Categoria
            </button>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Tarefa
            </button>
          </div>
        )}

        {subTab === 'decisoes' && (
          <button
            onClick={() => setIsDecisionModalOpen(true)}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity flex items-center gap-1.5"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Decisão
          </button>
        )}

        {subTab === 'cronograma' && (
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity flex items-center gap-1.5"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Evento
          </button>
        )}
      </div>

      {/* SUBTAB 1: TAREFAS */}
      {subTab === 'tarefas' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar tarefa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-marsala"
              />
            </div>

            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-marsala bg-white"
            >
              <option value="">Todas as categorias</option>
              {categoriasTarefa.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-marsala bg-white"
            >
              <option value="">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDA">Concluída</option>
            </select>
          </div>

          {/* Tasks List */}
          {filteredTarefas.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/80 space-y-2">
              <CheckSquare className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-medium text-stone-600">Nenhuma tarefa encontrada.</p>
              <p className="text-xs text-stone-400">Crie uma nova tarefa para começar a organizar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTarefas.map(task => {
                const category = categoriasTarefa.find(c => c.id === task.categoria_id);
                const isOverdue = task.status !== 'CONCLUIDA' && task.prazo && task.prazo < new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start gap-3 bg-white ${
                      task.status === 'CONCLUIDA'
                        ? 'opacity-70 border-stone-200 bg-stone-50/50'
                        : isOverdue
                        ? 'border-rose-200 shadow-2xs'
                        : 'border-stone-200 shadow-2xs hover:border-stone-300'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors mt-0.5 ${
                        task.status === 'CONCLUIDA'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-stone-300 hover:border-stone-500 bg-white'
                      }`}
                    >
                      {task.status === 'CONCLUIDA' && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-bold ${task.status === 'CONCLUIDA' ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                          {task.titulo}
                        </h4>

                        {/* Priority Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.prioridade === 'URGENTE'
                            ? 'bg-rose-100 text-rose-800'
                            : task.prioridade === 'ALTA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {task.prioridade}
                        </span>

                        {category && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                            {category.nome}
                          </span>
                        )}
                      </div>

                      {task.descricao && (
                        <p className="text-xs text-stone-600 leading-relaxed">{task.descricao}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-stone-400 pt-1">
                        {task.prazo && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-bold' : ''}`}>
                            <Clock className="w-3.5 h-3.5" />
                            Prazo: {task.prazo} {isOverdue && '(Atrasada)'}
                          </span>
                        )}
                        {task.responsavel_id && (
                          <span className="flex items-center gap-1 text-stone-500">
                            <User className="w-3.5 h-3.5" />
                            Atribuído a: {task.responsavel_id === 'usr_noivo_1' ? (casamento?.nome_noivo || 'Noivo') + ' 🤵' : (casamento?.nome_noiva || 'Noiva') + ' 👰'}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-stone-300 hover:text-rose-600 p-1 rounded-lg transition-colors"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: DECISÕES */}
      {subTab === 'decisoes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Column 1: PENDENTES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/80 p-3 rounded-2xl">
              <h3 className="font-serif font-bold text-amber-900 text-sm flex items-center gap-2">
                🤔 Ainda precisamos decidir
              </h3>
              <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                {decisoes.filter(d => d.status === 'PENDENTE').length}
              </span>
            </div>

            <div className="space-y-3">
              {decisoes.filter(d => d.status === 'PENDENTE').length === 0 ? (
                <p className="text-xs text-stone-400 italic p-6 text-center bg-white rounded-2xl border border-stone-100">
                  Nenhuma decisão pendente no momento! 🎉
                </p>
              ) : (
                decisoes.filter(d => d.status === 'PENDENTE').map(dec => (
                  <div key={dec.id} className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-stone-900">{dec.titulo}</h4>
                      <button
                        onClick={() => handleDeleteDecision(dec.id)}
                        className="text-stone-300 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {dec.descricao && <p className="text-xs text-stone-600">{dec.descricao}</p>}
                    <button
                      onClick={() => handleToggleDecision(dec)}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center gap-1 mt-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Marcar como Decidido ❤️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: DECIDIDAS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-rose-50/80 border border-rose-200/80 p-3 rounded-2xl">
              <h3 className="font-serif font-bold text-rose-900 text-sm flex items-center gap-2">
                ❤️ Já decidimos
              </h3>
              <span className="text-xs font-bold bg-rose-200 text-rose-900 px-2.5 py-0.5 rounded-full">
                {decisoes.filter(d => d.status === 'DECIDIDA').length}
              </span>
            </div>

            <div className="space-y-3">
              {decisoes.filter(d => d.status === 'DECIDIDA').length === 0 ? (
                <p className="text-xs text-stone-400 italic p-6 text-center bg-white rounded-2xl border border-stone-100">
                  Nenhuma decisão concluída ainda.
                </p>
              ) : (
                decisoes.filter(d => d.status === 'DECIDIDA').map(dec => (
                  <div key={dec.id} className="p-4 bg-stone-50/60 rounded-2xl border border-stone-200 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-stone-800 line-through">{dec.titulo}</h4>
                      <button
                        onClick={() => handleDeleteDecision(dec.id)}
                        className="text-stone-300 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {dec.descricao && <p className="text-xs text-stone-600">{dec.descricao}</p>}
                    {dec.data_decisao && (
                      <p className="text-[10px] text-stone-400 italic">
                        Decidido em: {dec.data_decisao}
                      </p>
                    )}
                    <button
                      onClick={() => handleToggleDecision(dec)}
                      className="text-xs text-stone-500 hover:text-stone-800 underline mt-1"
                    >
                      Reabrir discussão
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 3: CRONOGRAMA */}
      {subTab === 'cronograma' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-base">Linha do Tempo e Agendamentos</h3>
            
            {cronograma.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-8 text-center">
                Nenhum evento no cronograma. Adicione compromissos e datas chave.
              </p>
            ) : (
              <div className="relative border-l-2 border-stone-200 ml-4 space-y-6 py-2">
                {cronograma.map(evt => (
                  <div key={evt.id} className="relative pl-6">
                    <div
                      className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500">{evt.data_inicio}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-800">
                            {evt.tipo}
                          </span>
                          <button onClick={() => handleDeleteEvent(evt.id)} className="text-stone-300 hover:text-rose-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-stone-900">{evt.titulo}</h4>
                      {evt.descricao && <p className="text-xs text-stone-600">{evt.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Nova Tarefa do Casamento">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Título da Tarefa *</label>
            <input
              type="text"
              required
              placeholder="Ex: Degustação do Buffet"
              value={newTitulo}
              onChange={e => setNewTitulo(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Detalhes sobre a tarefa..."
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Categoria</label>
              <select
                value={newCatId}
                onChange={e => setNewCatId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none bg-white"
              >
                {categoriasTarefa.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Prioridade</label>
              <select
                value={newPrioridade}
                onChange={e => setNewPrioridade(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none bg-white"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Responsável</label>
              <select
                value={newResp}
                onChange={e => setNewResp(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none bg-white"
              >
                <option value="">Ambos (Juntos)</option>
                <option value="usr_noivo_1">{casamento?.nome_noivo || 'Noivo'} 🤵</option>
                <option value="usr_noiva_1">{casamento?.nome_noiva || 'Noiva'} 👰</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Prazo Limite</label>
              <input
                type="date"
                value={newPrazo}
                onChange={e => setNewPrazo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Cadastrar Tarefa
          </button>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="Nova Categoria de Tarefa">
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Nome da Categoria *</label>
            <input
              type="text"
              required
              placeholder="Ex: Cerimônia Religiosa"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Criar Categoria
          </button>
        </form>
      </Modal>

      {/* Decision Modal */}
      <Modal isOpen={isDecisionModalOpen} onClose={() => setIsDecisionModalOpen(false)} title="Nova Decisão Pendente">
        <form onSubmit={handleCreateDecision} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">O que precisamos decidir? *</label>
            <input
              type="text"
              required
              placeholder="Ex: Cor dos vestidos das madrinhas"
              value={decTitulo}
              onChange={e => setDecTitulo(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Opções e detalhes</label>
            <textarea
              rows={3}
              placeholder="Ex: Opção A: Marsala fechado. Opção B: Rosa chá..."
              value={decDesc}
              onChange={e => setDecDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Salvar Ponto de Decisão
          </button>
        </form>
      </Modal>

      {/* Event Modal */}
      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="Novo Compromisso / Evento">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Título do Evento *</label>
            <input
              type="text"
              required
              placeholder="Ex: Degustação de Doces"
              value={evtTitulo}
              onChange={e => setEvtTitulo(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Data / Horário *</label>
            <input
              type="text"
              required
              placeholder="Ex: 2026-09-12 15:00"
              value={evtDataInicio}
              onChange={e => setEvtDataInicio(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Tipo</label>
            <select
              value={evtTipo}
              onChange={e => setEvtTipo(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none bg-white"
            >
              <option value="EVENTO">Evento</option>
              <option value="PRAZO">Prazo Limite</option>
              <option value="COMPROMISSO">Compromisso</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              value={evtDesc}
              onChange={e => setEvtDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-marsala focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Adicionar ao Cronograma
          </button>
        </form>
      </Modal>

    </div>
  );
};
