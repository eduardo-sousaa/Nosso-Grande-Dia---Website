import React, { useState, useEffect } from 'react';
import { Settings, Palette, Calendar, User, Database, Shield, Download, Upload, Save, Check, Plus, Trash2, Camera } from 'lucide-react';
import { Casamento, Paleta, Cor, Usuario } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const Configuracoes: React.FC = () => {
  const { user, login, refreshCasamento } = useAuth();
  const { primaryColor, refreshPaleta, reloadTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'casamento' | 'paleta' | 'perfil' | 'backup'>('casamento');

  // Casamento Config State
  const [casamento, setCasamento] = useState<Casamento | null>(null);
  
  // Palette State
  const [paletaObj, setPaletaObj] = useState<Paleta | null>(null);
  const [cores, setCores] = useState<Cor[]>([]);

  // User Profile State
  const [nomeNoivo, setNomeNoivo] = useState(user?.nome_noivo || casamento?.nome_noivo || '');
  const [nomeNoiva, setNomeNoiva] = useState(user?.nome_noiva || casamento?.nome_noiva || '');
  const [emailUsuario, setEmailUsuario] = useState(user?.email || '');
  const [senhaNova, setSenhaNova] = useState('');
  const [fotoUsuario, setFotoUsuario] = useState(user?.foto || '');
  const [uploadingFoto, setUploadingFoto] = useState(false);

  useEffect(() => {
    if (user) {
      setNomeNoivo(user.nome_noivo || casamento?.nome_noivo || '');
      setNomeNoiva(user.nome_noiva || casamento?.nome_noiva || '');
      setEmailUsuario(user.email || '');
      setFotoUsuario(user.foto || '');
    }
  }, [user, casamento]);

  // Backup State
  const [backupJson, setBackupJson] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New color form
  const [newCorNome, setNewCorNome] = useState('');
  const [newCorHex, setNewCorHex] = useState('#800020');

  const loadAllConfig = async () => {
    try {
      const [cData, pData] = await Promise.all([
        api.getCasamento(),
        api.getPaleta()
      ]);
      setCasamento(cData);
      setPaletaObj(pData.paleta);
      setCores(pData.cores || []);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadAllConfig();
  }, []);

  // Save Casamento Config
  const handleSaveCasamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!casamento) return;
    try {
      await api.updateCasamento(casamento);
      await refreshCasamento();
      showSuccess();
    } catch (err) {
      console.error('Failed to save wedding config:', err);
    }
  };

  // Add Color to Palette
  const handleAddCor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCorNome.trim()) return;
    try {
      await api.addCor({
        nome: newCorNome,
        codigo_hex: newCorHex
      });
      setNewCorNome('');
      loadAllConfig();
      reloadTheme();
      showSuccess();
    } catch (err) {
      console.error('Failed to add color:', err);
    }
  };

  const handleDeleteCor = async (id: string) => {
    try {
      await api.deleteCor(id);
      loadAllConfig();
      reloadTheme();
    } catch (err) {
      console.error('Failed to delete color:', err);
    }
  };

  // Upload Profile Photo
  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFoto(true);
      const res = await api.uploadFile(file);
      setFotoUsuario(res.url);
    } catch (err) {
      console.error('Failed to upload profile photo:', err);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingFoto(false);
    }
  };

  // Save User Profile
  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const updated = await api.updatePerfil(user.id, {
        nome_noivo: nomeNoivo,
        nome_noiva: nomeNoiva,
        email: emailUsuario,
        senha: senhaNova || undefined,
        foto: fotoUsuario
      });
      login(updated);
      await refreshCasamento();
      setSenhaNova('');
      showSuccess();
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  // Export Backup
  const handleExportBackup = async () => {
    try {
      const data = await api.exportBackup();
      const str = JSON.stringify(data, null, 2);
      setBackupJson(str);

      // Trigger browser download
      const blob = new Blob([str], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nosso_grande_dia_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Import Backup
  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupJson) return;
    try {
      const parsed = JSON.parse(backupJson);
      await api.importBackup(parsed);
      alert('Backup importado com sucesso! A página será atualizada.');
      window.location.reload();
    } catch (err) {
      alert('Erro ao importar backup: arquivo JSON inválido.');
    }
  };

  const showSuccess = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-stone-900">Configurações & Personalização</h2>
        <p className="text-xs text-stone-500">Ajuste os dados do casamento, cores do sistema e backup de dados</p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" />
          Alterações salvas com sucesso!
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex gap-2 border-b border-[#E5E2D9] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('casamento')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'casamento' ? 'bg-[#800020] text-white shadow-xs' : 'bg-white text-[#2D2D2D] hover:bg-[#F4F1E8] border border-[#E5E2D9]'
          }`}
        >
          <Calendar className="w-4 h-4 text-[#556B2F]" />
          Dados do Casamento
        </button>

        <button
          onClick={() => setActiveTab('paleta')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'paleta' ? 'bg-[#800020] text-white shadow-xs' : 'bg-white text-[#2D2D2D] hover:bg-[#F4F1E8] border border-[#E5E2D9]'
          }`}
        >
          <Palette className="w-4 h-4 text-[#556B2F]" />
          Paleta Visual Dinâmica
        </button>

        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'perfil' ? 'bg-[#800020] text-white shadow-xs' : 'bg-white text-[#2D2D2D] hover:bg-[#F4F1E8] border border-[#E5E2D9]'
          }`}
        >
          <User className="w-4 h-4 text-[#556B2F]" />
          Perfil do Usuário
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'backup' ? 'bg-[#800020] text-white shadow-xs' : 'bg-white text-[#2D2D2D] hover:bg-[#F4F1E8] border border-[#E5E2D9]'
          }`}
        >
          <Database className="w-4 h-4 text-[#556B2F]" />
          Backup & Segurança
        </button>
      </div>

      {/* TAB 1: CASAMENTO */}
      {activeTab === 'casamento' && casamento && (
        <form onSubmit={handleSaveCasamento} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-lg text-stone-900">Informações Principais</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Noivo *</label>
              <input
                type="text"
                required
                value={casamento.nome_noivo}
                onChange={e => setCasamento({ ...casamento, nome_noivo: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nome da Noiva *</label>
              <input
                type="text"
                required
                value={casamento.nome_noiva}
                onChange={e => setCasamento({ ...casamento, nome_noiva: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Data do Casamento *</label>
              <input
                type="date"
                required
                value={casamento.data_casamento || ''}
                onChange={e => setCasamento({ ...casamento, data_casamento: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Horário da Cerimônia</label>
              <input
                type="text"
                placeholder="Ex: 16:30"
                value={casamento.horario || ''}
                onChange={e => setCasamento({ ...casamento, horario: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Local do Evento</label>
              <input
                type="text"
                value={casamento.local || ''}
                onChange={e => setCasamento({ ...casamento, local: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Cidade / Estado</label>
              <input
                type="text"
                value={casamento.cidade || ''}
                onChange={e => setCasamento({ ...casamento, cidade: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Slogan ou Frase do Casal</label>
            <input
              type="text"
              placeholder="Ex: Onde o amor se faz lar"
              value={casamento.frase || ''}
              onChange={e => setCasamento({ ...casamento, frase: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-6 rounded-xl text-white font-bold text-sm shadow-xs hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="w-4 h-4" />
            Salvar Dados
          </button>
        </form>
      )}

      {/* TAB 2: PALETA DE CORES */}
      {activeTab === 'paleta' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">Paleta de Cores Oficial do Casamento</h3>
            <p className="text-xs text-stone-500">
              Cores cadastradas na paleta do evento. A cor primária define a tonalidade dos botões e destaques.
            </p>
          </div>

          {/* Color list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {cores.map(cor => (
              <div key={cor.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl shadow-xs border border-black/10 shrink-0"
                    style={{ backgroundColor: cor.codigo_hex }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">{cor.nome}</h4>
                    <p className="text-[10px] font-mono text-stone-500 uppercase">{cor.codigo_hex}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteCor(cor.id)} className="text-stone-300 hover:text-rose-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add color form */}
          <form onSubmit={handleAddCor} className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nome da Cor</label>
              <input
                type="text"
                required
                placeholder="Ex: Marsala, Verde Oliva, Rosa Chá"
                value={newCorNome}
                onChange={e => setNewCorNome(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200"
              />
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Seletor de Cor</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCorHex}
                  onChange={e => setNewCorHex(e.target.value)}
                  className="w-9 h-9 rounded-xl border-0 cursor-pointer"
                />
                <span className="text-xs font-mono uppercase text-stone-600">{newCorHex}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-90 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4" />
              Adicionar Cor
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: PERFIL */}
      {activeTab === 'perfil' && user && (
        <form onSubmit={handleSavePerfil} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-6">
          <h3 className="font-serif font-bold text-lg text-stone-900">Perfil de Acesso do Casal</h3>

          {/* Profile Photo Upload Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-[#FAF6F0] rounded-2xl border border-[#E5E2D9]">
            <div className="relative group shrink-0">
              {fotoUsuario ? (
                <img
                  src={fotoUsuario}
                  alt={user.nome}
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#800020] shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#800020] text-white text-xl font-bold flex items-center justify-center border-2 border-[#800020] shadow-md">
                  {nomeNoivo?.[0] || 'N'}&{nomeNoiva?.[0] || 'N'}
                </div>
              )}
              {uploadingFoto && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-xs font-bold backdrop-blur-xs">
                  Carregando...
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h4 className="text-sm font-bold text-[#2D2D2D]">Foto do Casal / Avatar</h4>
              <p className="text-xs text-stone-500">
                Escolha uma foto (JPG, PNG ou WEBP) do casal para personalizar o perfil no sistema.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5E2D9] text-[#2D2D2D] hover:bg-[#F4F1E8] text-xs font-bold transition-all shadow-xs">
                  <Upload className="w-4 h-4 text-[#800020]" />
                  {uploadingFoto ? 'Enviando...' : 'Fazer Upload de Foto'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoUpload}
                    disabled={uploadingFoto}
                    className="hidden"
                  />
                </label>

                {fotoUsuario && (
                  <button
                    type="button"
                    onClick={() => setFotoUsuario('')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    Remover Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Noivo 🤵</label>
              <input
                type="text"
                required
                value={nomeNoivo}
                onChange={e => setNomeNoivo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nome da Noiva 👰</label>
              <input
                type="text"
                required
                value={nomeNoiva}
                onChange={e => setNomeNoiva(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Endereço de E-mail de Acesso do Casal</label>
            <input
              type="email"
              required
              value={emailUsuario}
              onChange={e => setEmailUsuario(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Alterar Senha de Acesso (Opcional)</label>
            <input
              type="password"
              placeholder="Deixe em branco para manter a senha atual"
              value={senhaNova}
              onChange={e => setSenhaNova(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
            />
          </div>

          <button
            type="submit"
            disabled={uploadingFoto}
            className="py-2.5 px-6 rounded-xl text-white font-bold text-sm shadow-xs hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="w-4 h-4" />
            Atualizar Perfil do Casal
          </button>
        </form>
      )}

      {/* TAB 4: BACKUP */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-800" />
              Exportar Backup Completo (JSON)
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Faça o download de todos os seus dados do casamento (tarefas, orçamento, convidados, diário e imagens) em um único arquivo de segurança.
            </p>
            <button
              onClick={handleExportBackup}
              className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar Arquivo JSON de Backup
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-800" />
              Restaurar / Importar Backup
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Cole o conteúdo do seu arquivo JSON de backup abaixo para restaurar o sistema.
            </p>

            <form onSubmit={handleImportBackup} className="space-y-3">
              <textarea
                rows={6}
                placeholder='Cole o conteúdo do JSON de backup aqui...'
                value={backupJson}
                onChange={e => setBackupJson(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-200 focus:ring-1 focus:ring-marsala"
              />
              <button
                type="submit"
                disabled={!backupJson.trim()}
                className="px-5 py-2.5 rounded-xl text-white font-bold text-xs hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <Upload className="w-4 h-4" />
                Importar e Sobrescrever Dados
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};
