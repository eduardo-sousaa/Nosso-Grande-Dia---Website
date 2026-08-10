import React, { useState, useEffect } from 'react';
import { Building, Plus, Phone, Mail, Instagram, Globe, Trash2, Edit2, FileText, DollarSign } from 'lucide-react';
import { Fornecedor } from '../types';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';

export const Fornecedores: React.FC = () => {
  const { primaryColor } = useTheme();

  const [fornecedores, setFornecedores] = useState<(Fornecedor & { total_despesas: number; valor_total_contratado: number })[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [site, setSite] = useState('');
  const [observacao, setObservacao] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getFornecedores();
      setFornecedores(data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFornecedor({
        nome,
        categoria: categoria || 'Geral',
        telefone,
        email,
        instagram,
        site,
        observacao
      });
      setNome('');
      setCategoria('');
      setTelefone('');
      setEmail('');
      setInstagram('');
      setSite('');
      setObservacao('');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Create supplier failed:', err);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await api.deleteFornecedor(id);
      loadData();
    } catch (err) {
      console.error('Delete supplier failed:', err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Fornecedores</h2>
          <p className="text-xs text-stone-500">Cadastro de contatos de parceiros e serviços contratados</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 flex items-center gap-1.5 self-start sm:self-auto"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4" />
          Cadastrar Fornecedor
        </button>
      </div>

      {/* Grid */}
      {fornecedores.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
          <Building className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-sm font-medium text-stone-600">Nenhum fornecedor cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fornecedores.map(forn => (
            <div key={forn.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {forn.categoria}
                    </span>
                    <h3 className="text-base font-serif font-bold text-stone-900 mt-1">{forn.nome}</h3>
                  </div>
                  <button onClick={() => handleDeleteSupplier(forn.id)} className="text-stone-300 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 pt-2 text-xs text-stone-600">
                  {forn.telefone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      {forn.telefone}
                    </p>
                  )}
                  {forn.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      {forn.email}
                    </p>
                  )}
                  {forn.instagram && (
                    <p className="flex items-center gap-2">
                      <Instagram className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      {forn.instagram}
                    </p>
                  )}
                  {forn.site && (
                    <p className="flex items-center gap-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <a href={forn.site} target="_blank" rel="noreferrer" className="text-marsala hover:underline truncate">
                        {forn.site}
                      </a>
                    </p>
                  )}
                </div>

                {forn.observacao && (
                  <p className="text-xs text-stone-500 bg-stone-50 p-2 rounded-xl italic mt-2">
                    "{forn.observacao}"
                  </p>
                )}
              </div>

              {/* Summary of linked expenses */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1 font-medium">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  Contratado: {formatCurrency(forn.valor_total_contratado)}
                </span>
                <span className="text-[10px] font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                  {forn.total_despesas} contrato(s)
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Fornecedor">
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Fornecedor / Empresa *</label>
            <input
              type="text"
              required
              placeholder="Ex: Quinta das Flores Eventos"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Categoria de Serviço</label>
              <input
                type="text"
                placeholder="Ex: Local & Buffet, Fotografia, etc."
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail</label>
              <input
                type="email"
                placeholder="contato@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Instagram</label>
              <input
                type="text"
                placeholder="@empresa"
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Website</label>
            <input
              type="text"
              placeholder="https://..."
              value={site}
              onChange={e => setSite(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Observações</label>
            <textarea
              rows={2}
              placeholder="Detalhes adicionais..."
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
            Cadastrar Fornecedor
          </button>
        </form>
      </Modal>

    </div>
  );
};
