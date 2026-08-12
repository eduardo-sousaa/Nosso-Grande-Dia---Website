import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Edit2, AlertCircle, CheckCircle, PieChart, TrendingUp } from 'lucide-react';
import { Despesa, CategoriaFinanceira, Fornecedor } from '../types';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';

export const Orcamento: React.FC = () => {
  const { primaryColor } = useTheme();

  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [descricao, setDescricao] = useState('');
  const [catId, setCatId] = useState('');
  const [fornId, setFornId] = useState('');
  const [valorPrevisto, setValorPrevisto] = useState<number>(0);
  const [valorFinal, setValorFinal] = useState<number>(0);
  const [valorPago, setValorPago] = useState<number>(0);
  const [dataVencimento, setDataVencimento] = useState('');
  const [status, setStatus] = useState<Despesa['status']>('PLANEJADO');
  const [observacao, setObservacao] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getOrcamento();
      setDespesas(data.despesas);
      setCategorias(data.categorias);
      setFornecedores(data.fornecedores);
      if (data.categorias.length > 0) setCatId(data.categorias[0].id);
    } catch (err) {
      console.error('Failed to load budget:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDespesa({
        descricao,
        categoria_id: catId || categorias[0]?.id || 'cat_fin_1',
        fornecedor_id: fornId || undefined,
        valor_previsto: Number(valorPrevisto),
        valor_final: Number(valorFinal || valorPrevisto),
        valor_pago: Number(valorPago),
        data_vencimento: dataVencimento || undefined,
        status,
        observacao
      });
      setDescricao('');
      setValorPrevisto(0);
      setValorFinal(0);
      setValorPago(0);
      setDataVencimento('');
      setObservacao('');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Create expense failed:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await api.deleteDespesa(id);
      loadData();
    } catch (err) {
      console.error('Delete expense failed:', err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Calculations
  const activeDespesas = despesas.filter(d => d.status !== 'CANCELADO');
  const totalPlanejado = activeDespesas.reduce((a, b) => a + (b.valor_previsto || 0), 0);
  const totalContratado = activeDespesas.reduce((a, b) => a + (b.valor_final || 0), 0);
  const totalPago = activeDespesas.reduce((a, b) => a + (b.valor_pago || 0), 0);
  const totalRestante = Math.max(0, totalContratado - totalPago);

  // Filtered List
  const filtered = despesas.filter(d => {
    const matchesCat = !catFilter || d.categoria_id === catFilter;
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Orçamento & Financeiro</h2>
          <p className="text-xs text-stone-500">Controle de orçamentos previstos, contratos e parcelas pagas</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 flex items-center gap-1.5 self-start sm:self-auto"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4" />
          Nova Despesa
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-xs text-stone-500 font-medium">Total Planejado</p>
          <p className="text-xl font-serif font-bold text-stone-900 mt-1">{formatCurrency(totalPlanejado)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-xs text-stone-500 font-medium">Total Contratado</p>
          <p className="text-xl font-serif font-bold text-stone-900 mt-1">{formatCurrency(totalContratado)}</p>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 shadow-2xs">
          <p className="text-xs text-emerald-800 font-medium">Total Pago</p>
          <p className="text-xl font-serif font-bold text-emerald-900 mt-1">{formatCurrency(totalPago)}</p>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-100 shadow-2xs">
          <p className="text-xs text-rose-800 font-medium">Total Restante</p>
          <p className="text-xl font-serif font-bold text-rose-900 mt-1">{formatCurrency(totalRestante)}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-marsala bg-white"
        >
          <option value="">Todas as categorias financeiras</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-marsala bg-white"
        >
          <option value="">Todos os status</option>
          <option value="PLANEJADO">Planejado</option>
          <option value="CONTRATADO">Contratado</option>
          <option value="PARCIALMENTE_PAGO">Parcialmente Pago</option>
          <option value="PAGO">Pago</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <DollarSign className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-medium text-stone-600">Nenhuma despesa cadastrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered.map(desp => {
              const categoria = categorias.find(c => c.id === desp.categoria_id);
              const fornecedor = fornecedores.find(f => f.id === desp.fornecedor_id);

              return (
                <div key={desp.id} className="p-4 hover:bg-stone-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-stone-900">{desp.descricao}</h4>
                      {categoria && (
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                          {categoria.nome}
                        </span>
                      )}
                      {fornecedor && (
                        <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full">
                          {fornecedor.nome}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-500">
                      <span>Previsto: <strong>{formatCurrency(desp.valor_previsto)}</strong></span>
                      <span>Contratado: <strong>{formatCurrency(desp.valor_final)}</strong></span>
                      <span className="text-emerald-700">Pago: <strong>{formatCurrency(desp.valor_pago)}</strong></span>
                    </div>

                    {desp.observacao && <p className="text-xs text-stone-500 italic">{desp.observacao}</p>}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                      desp.status === 'PAGO'
                        ? 'bg-emerald-100 text-emerald-900'
                        : desp.status === 'PARCIALMENTE_PAGO'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {desp.status.replace('_', ' ')}
                    </span>

                    <button
                      onClick={() => handleDeleteExpense(desp.id)}
                      className="text-stone-300 hover:text-rose-600 p-1"
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

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Despesa / Contrato">
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição do Item *</label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel do Espaço + Buffet"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Categoria Financeira</label>
              <select
                value={catId}
                onChange={e => setCatId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala bg-white"
              >
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Fornecedor (Opcional)</label>
              <select
                value={fornId}
                onChange={e => setFornId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala bg-white"
              >
                <option value="">Nenhum fornecedor vinculado</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Valor Previsto (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={valorPrevisto}
                onChange={e => setValorPrevisto(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Valor Contratado (R$)</label>
              <input
                type="number"
                step="0.01"
                value={valorFinal}
                onChange={e => setValorFinal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Valor Já Pago (R$)</label>
              <input
                type="number"
                step="0.01"
                value={valorPago}
                onChange={e => setValorPago(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Data de Vencimento</label>
              <input
                type="date"
                value={dataVencimento}
                onChange={e => setDataVencimento(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Status do Pagamento</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala bg-white"
              >
                <option value="PLANEJADO">Planejado</option>
                <option value="CONTRATADO">Contratado</option>
                <option value="PARCIALMENTE_PAGO">Parcialmente Pago</option>
                <option value="PAGO">Pago</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Observações / Parcelamento</label>
            <input
              type="text"
              placeholder="Ex: Parcela 1/4 paga via PIX"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Cadastrar Despesa
          </button>
        </form>
      </Modal>

    </div>
  );
};
