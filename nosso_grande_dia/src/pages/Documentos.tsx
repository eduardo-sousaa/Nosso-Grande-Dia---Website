import React, { useState, useEffect } from 'react';
import { FileText, Upload, Plus, Trash2, Download, Folder } from 'lucide-react';
import { Documento, CategoriaDocumento } from '../types';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';

export const Documentos: React.FC = () => {
  const { primaryColor } = useTheme();

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDocumento[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [catFilter, setCatFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [nome, setNome] = useState('');
  const [desc, setDesc] = useState('');
  const [catId, setCatId] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDocumentos();
      setDocumentos(data.documentos);
      setCategorias(data.categorias);
      if (data.categorias.length > 0) setCatId(data.categorias[0].id);
    } catch (err) {
      console.error('Failed to load documents:', err);
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
      setFileUrl(res.url);
      setFileName(res.nome_original);
      if (!nome) setNome(res.nome_original);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) return;
    try {
      await api.createDocumento({
        nome,
        descricao: desc,
        categoria_id: catId || categorias[0]?.id || 'cat_doc_1',
        nome_arquivo: fileName || 'documento.pdf',
        caminho: fileUrl
      });
      setNome('');
      setDesc('');
      setFileUrl('');
      setFileName('');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Create document failed:', err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await api.deleteDocumento(id);
      loadData();
    } catch (err) {
      console.error('Delete document failed:', err);
    }
  };

  const filtered = documentos.filter(d => !catFilter || d.categoria_id === catFilter);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Documentos & Contratos</h2>
          <p className="text-xs text-stone-500">Armazene contratos assinados, comprovantes, termos e garantias</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 flex items-center gap-1.5 self-start sm:self-auto"
          style={{ backgroundColor: primaryColor }}
        >
          <Upload className="w-4 h-4" />
          Enviar Documento
        </button>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCatFilter('')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            !catFilter ? 'bg-stone-900 text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          Todos os Documentos
        </button>
        {categorias.map(c => (
          <button
            key={c.id}
            onClick={() => setCatFilter(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              catFilter === c.id ? 'bg-stone-900 text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
          <FileText className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-sm font-medium text-stone-600">Nenhum documento nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const categoria = categorias.find(c => c.id === doc.categoria_id);

            return (
              <div key={doc.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3 flex flex-col justify-between">
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        {categoria && (
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            {categoria.nome}
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-stone-900 leading-snug">{doc.nome}</h3>
                      </div>
                    </div>
                  </div>

                  {doc.descricao && <p className="text-xs text-stone-600 leading-relaxed">{doc.descricao}</p>}
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <a
                    href={doc.caminho}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-marsala hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Documento
                  </a>

                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
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

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enviar Novo Documento">
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Selecione o Arquivo (PDF, Imagem, Word, etc) *</label>
            <input
              type="file"
              required={!fileUrl}
              onChange={handleFileUpload}
              className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
            />
            {uploading && <p className="text-xs text-amber-700 mt-1">Enviando arquivo...</p>}
            {fileUrl && <p className="text-xs text-emerald-700 mt-1">✓ Arquivo recebido: {fileName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Nome de Exibição do Documento *</label>
            <input
              type="text"
              required
              placeholder="Ex: Contrato Buffet Quinta das Flores"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Categoria de Documento</label>
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
            <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Resumo do documento..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <button
            type="submit"
            disabled={!fileUrl || uploading}
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            Salvar Documento
          </button>
        </form>
      </Modal>

    </div>
  );
};
