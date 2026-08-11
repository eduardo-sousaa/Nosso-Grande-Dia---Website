import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, Image as ImageIcon, Heart, Trash2, Upload, FolderPlus, ArrowLeft, Maximize2 } from 'lucide-react';
import { Album, Imagem } from '../types';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';

export const Ideias: React.FC = () => {
  const { primaryColor } = useTheme();

  const [albuns, setAlbuns] = useState<(Album & { total_imagens: number })[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImgLightbox, setSelectedImgLightbox] = useState<Imagem | null>(null);

  // Delete Confirmation States
  const [albumToDelete, setAlbumToDelete] = useState<{ id: string; nome: string } | null>(null);
  const [imgToDelete, setImgToDelete] = useState<string | null>(null);
  const [deletingAlbum, setDeletingAlbum] = useState(false);
  const [deletingImg, setDeletingImg] = useState(false);

  // Forms
  const [albumNome, setAlbumNome] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');

  const [imgUrl, setImgUrl] = useState('');
  const [imgDesc, setImgDesc] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadAlbuns = async () => {
    setLoading(true);
    try {
      const data = await api.getAlbuns();
      setAlbuns(data);
    } catch (err) {
      console.error('Failed to load albums:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlbumImagens = async (albumId: string) => {
    try {
      const data = await api.getAlbumImagens(albumId);
      setImagens(data);
    } catch (err) {
      console.error('Failed to load album images:', err);
    }
  };

  useEffect(() => {
    loadAlbuns();
  }, []);

  const handleOpenAlbum = (album: Album) => {
    setSelectedAlbum(album);
    loadAlbumImagens(album.id);
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAlbum({ nome: albumNome, descricao: albumDesc });
      setAlbumNome('');
      setAlbumDesc('');
      setIsAlbumModalOpen(false);
      loadAlbuns();
    } catch (err) {
      console.error('Create album failed:', err);
    }
  };

  const handleDeleteAlbum = (id: string, nome: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlbumToDelete({ id, nome });
  };

  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return;
    setDeletingAlbum(true);
    try {
      await api.deleteAlbum(albumToDelete.id);
      setAlbumToDelete(null);
      if (selectedAlbum?.id === albumToDelete.id) {
        setSelectedAlbum(null);
      }
      loadAlbuns();
    } catch (err) {
      console.error('Delete album failed:', err);
    } finally {
      setDeletingAlbum(false);
    }
  };

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

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbum || !imgUrl) return;
    try {
      await api.addImagem({
        album_id: selectedAlbum.id,
        caminho: imgUrl,
        descricao: imgDesc,
        nome_original: 'Inspiracao.jpg',
        nome_arquivo: 'Inspiracao.jpg'
      });
      setImgUrl('');
      setImgDesc('');
      setIsImageModalOpen(false);
      loadAlbumImagens(selectedAlbum.id);
      loadAlbuns();
    } catch (err) {
      console.error('Add image failed:', err);
    }
  };

  const handleToggleFavorite = async (imgId: string) => {
    try {
      await api.toggleFavoritaImagem(imgId);
      if (selectedAlbum) loadAlbumImagens(selectedAlbum.id);
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  const handleDeleteImage = (imgId: string) => {
    setImgToDelete(imgId);
  };

  const confirmDeleteImage = async () => {
    if (!imgToDelete) return;
    setDeletingImg(true);
    try {
      await api.deleteImagem(imgToDelete);
      setImgToDelete(null);
      if (selectedAlbum) loadAlbumImagens(selectedAlbum.id);
      loadAlbuns();
    } catch (err) {
      console.error('Delete image failed:', err);
    } finally {
      setDeletingImg(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {selectedAlbum && (
              <button
                onClick={() => setSelectedAlbum(null)}
                className="p-1 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 mr-1"
                title="Voltar aos álbuns"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              {selectedAlbum ? selectedAlbum.nome : 'Mural de Inspirações'}
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {selectedAlbum
              ? selectedAlbum.descricao || 'Coleção de fotos de referência'
              : 'Organize imagens de vestidos, decoração, bolo, convites e referências do casamento'}
          </p>
        </div>

        <div>
          {selectedAlbum ? (
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <Upload className="w-4 h-4" />
              Adicionar Foto
            </button>
          ) : (
            <button
              onClick={() => setIsAlbumModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <FolderPlus className="w-4 h-4" />
              Novo Álbum
            </button>
          )}
        </div>
      </div>

      {/* ALBUM VIEW vs GALLERY VIEW */}
      {!selectedAlbum ? (
        
        albuns.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF6F0] flex items-center justify-center text-[#800020] border border-[#E5E2D9]">
              <FolderPlus className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-serif font-bold text-stone-900 text-lg">Nenhum álbum criado ainda</h3>
              <p className="text-xs text-stone-500">
                Crie seus próprios álbuns para organizar fotos, vestidos, decorações, convites e referências do seu casamento!
              </p>
            </div>
            <button
              onClick={() => setIsAlbumModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4" />
              Criar Meu Primeiro Álbum
            </button>
          </div>
        ) : (
          /* Album Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {albuns.map(album => (
              <div
                key={album.id}
                onClick={() => handleOpenAlbum(album)}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col"
              >
                <div className="relative h-44 bg-stone-100 overflow-hidden">
                  {album.capa ? (
                    <img
                      src={album.capa}
                      alt={album.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <ImageIcon className="w-10 h-10 stroke-[1.5]" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-stone-900/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {album.total_imagens} foto(s)
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-base group-hover:text-marsala transition-colors">
                      {album.nome}
                    </h3>
                    {album.descricao && (
                      <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">{album.descricao}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
                    <span className="text-[10px] text-stone-400 font-medium">Ver fotos →</span>
                    <button
                      onClick={e => handleDeleteAlbum(album.id, album.nome, e)}
                      className="text-stone-300 hover:text-rose-600 p-1 transition-colors"
                      title="Excluir álbum"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      ) : (

        /* Images Inside Selected Album View */
        <div className="space-y-4">
          {imagens.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
              <ImageIcon className="w-12 h-12 text-stone-300 mx-auto" />
              <p className="text-sm font-medium text-stone-600">Este álbum ainda não possui fotos.</p>
              <button
                onClick={() => setIsImageModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Adicionar primeira foto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagens.map(img => (
                <div
                  key={img.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs group relative space-y-2 p-2"
                >
                  <div className="relative h-56 rounded-xl overflow-hidden bg-stone-100">
                    <img
                      src={img.caminho}
                      alt={img.descricao || 'Foto de inspiração'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Top actions overlay */}
                    <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                      <button
                        onClick={() => handleToggleFavorite(img.id)}
                        className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
                          img.favorita ? 'bg-rose-500 text-white' : 'bg-stone-900/40 text-white hover:bg-rose-500'
                        }`}
                        title="Favoritar"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        onClick={() => setSelectedImgLightbox(img)}
                        className="p-1.5 rounded-full bg-stone-900/40 text-white hover:bg-stone-900 backdrop-blur-md"
                        title="Ampliar"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {img.descricao && (
                    <p className="text-xs text-stone-700 px-1 line-clamp-2">{img.descricao}</p>
                  )}

                  <div className="flex items-center justify-between px-1 pt-1">
                    <span className="text-[10px] text-stone-400">
                      {new Date(img.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="text-stone-300 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      )}

      {/* Album Modal */}
      <Modal isOpen={isAlbumModalOpen} onClose={() => setIsAlbumModalOpen(false)} title="Novo Álbum de Inspirações">
        <form onSubmit={handleCreateAlbum} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Álbum *</label>
            <input
              type="text"
              required
              placeholder="Ex: Penteados e Maquiagem"
              value={albumNome}
              onChange={e => setAlbumNome(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Ex: Ideias para coques e maquiagem leve"
              value={albumDesc}
              onChange={e => setAlbumDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Criar Álbum
          </button>
        </form>
      </Modal>

      {/* Add Image Modal */}
      <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} title="Adicionar Foto ao Álbum">
        <form onSubmit={handleAddImage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Enviar Imagem do Computador/Celular</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
            />
            {uploading && <p className="text-xs text-amber-700 mt-1">Enviando arquivo...</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Ou cole a URL da Imagem (Unsplash, Pinterest, etc)</label>
            <input
              type="text"
              placeholder="https://..."
              value={imgUrl}
              onChange={e => setImgUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          {imgUrl && (
            <div className="h-32 w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
              <img src={imgUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição / Comentário da Foto</label>
            <input
              type="text"
              placeholder="Ex: Amei os tons do arranjo floral"
              value={imgDesc}
              onChange={e => setImgDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <button
            type="submit"
            disabled={!imgUrl || uploading}
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            Adicionar Imagem
          </button>
        </form>
      </Modal>

      {/* Lightbox Modal */}
      {selectedImgLightbox && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/90 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setSelectedImgLightbox(null)}
        >
          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3">
            <img
              src={selectedImgLightbox.caminho}
              alt={selectedImgLightbox.descricao || 'Foto'}
              className="max-h-[80vh] w-auto rounded-2xl shadow-2xl object-contain"
            />
            {selectedImgLightbox.descricao && (
              <p className="text-white text-sm bg-stone-900/80 px-4 py-2 rounded-full text-center">
                {selectedImgLightbox.descricao}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão do Álbum */}
      <Modal isOpen={!!albumToDelete} onClose={() => setAlbumToDelete(null)} title="Excluir Álbum">
        <div className="space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed">
            Tem certeza que deseja excluir o álbum <strong>{albumToDelete?.nome}</strong> e todas as fotos dele? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setAlbumToDelete(null)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deletingAlbum}
              onClick={confirmDeleteAlbum}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors disabled:opacity-50"
            >
              {deletingAlbum ? 'Excluindo...' : 'Sim, Excluir Álbum'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão da Foto */}
      <Modal isOpen={!!imgToDelete} onClose={() => setImgToDelete(null)} title="Excluir Imagem">
        <div className="space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed">
            Tem certeza que deseja remover esta imagem do álbum?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setImgToDelete(null)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deletingImg}
              onClick={confirmDeleteImage}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors disabled:opacity-50"
            >
              {deletingImg ? 'Removendo...' : 'Sim, Remover Foto'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
