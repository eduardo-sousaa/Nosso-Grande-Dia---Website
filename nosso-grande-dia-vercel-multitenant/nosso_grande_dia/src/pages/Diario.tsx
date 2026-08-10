import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Heart, Calendar, Trash2, Image as ImageIcon, Sparkles, Upload } from 'lucide-react';
import { DiarioMemoria } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';

export const Diario: React.FC = () => {
  const { user, casamento } = useAuth();
  const { primaryColor } = useTheme();

  const [memorias, setMemorias] = useState<DiarioMemoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [dataMemoria, setDataMemoria] = useState(new Date().toISOString().split('T')[0]);
  const [imgUrl, setImgUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDiario();
      setMemorias(data);
    } catch (err) {
      console.error('Failed to load journal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      setImgUrl(res.url);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDiarioMemoria({
        titulo,
        conteudo,
        data_memoria: dataMemoria,
        usuario_id: user?.id || 'usr_noivo_1',
        imagens: imgUrl ? [imgUrl] : []
      });
      setTitulo('');
      setConteudo('');
      setImgUrl('');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Create memory failed:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.deleteDiarioMemoria(id);
      loadData();
    } catch (err) {
      console.error('Delete memory failed:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
            Nosso Diário de Memórias
            <Heart className="w-5 h-5 text-marsala fill-marsala/20" />
          </h2>
          <p className="text-xs text-stone-500">
            Registre os momentos inesquecíveis, o pedido de noivado e a história do casal durante o planejamento
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 flex items-center gap-1.5 self-start sm:self-auto"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4" />
          Nova Memória
        </button>
      </div>

      {/* Memory Cards Feed */}
      {memorias.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-sm font-medium text-stone-600">Nenhuma memória registrada ainda.</p>
          <p className="text-xs text-stone-400">Clique em "Nova Memória" para eternizar o primeiro capítulo!</p>
        </div>
      ) : (
        <div className="space-y-6 relative border-l-2 border-amber-200/60 ml-4 sm:ml-6 pl-6 sm:pl-8 py-2">
          {memorias.map(mem => (
            <div key={mem.id} className="relative group">
              
              {/* Timeline Pin */}
              <div
                className="absolute -left-[31px] sm:-left-[41px] top-4 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-[10px] text-white"
                style={{ backgroundColor: primaryColor }}
              >
                ❤️
              </div>

              <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4">
                
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {mem.data_memoria}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-stone-900 mt-1">{mem.titulo}</h3>
                  </div>

                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="text-stone-300 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line font-serif italic">
                  "{mem.conteudo}"
                </p>

                {mem.imagens && mem.imagens.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {mem.imagens.map((img, idx) => (
                      <div key={idx} className="h-64 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                        <img src={img} alt="Foto da memória" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-[11px] text-stone-400 font-sans">
                  <span>Registrado por {mem.usuario_id === 'usr_noivo_1' ? (casamento?.nome_noivo || 'Noivo') + ' 🤵' : (casamento?.nome_noiva || 'Noiva') + ' 👰'}</span>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Memória no Diário">
        <form onSubmit={handleCreateMemory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Título do Momento *</label>
            <input
              type="text"
              required
              placeholder="Ex: O dia do pedido de noivado!"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Data do Acontecimento *</label>
            <input
              type="date"
              required
              value={dataMemoria}
              onChange={e => setDataMemoria(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Relato / História *</label>
            <textarea
              rows={5}
              required
              placeholder="Escreva com carinho os detalhes desse momento especial..."
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Anexar Foto da Memória</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
            />
            {uploading && <p className="text-xs text-amber-700 mt-1">Enviando foto...</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Ou cole URL da foto</label>
            <input
              type="text"
              placeholder="https://..."
              value={imgUrl}
              onChange={e => setImgUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Salvar Memória
          </button>
        </form>
      </Modal>

    </div>
  );
};
