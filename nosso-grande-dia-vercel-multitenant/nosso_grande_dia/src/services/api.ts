import {
  Usuario,
  Casamento,
  ResumoDashboard,
  Paleta,
  Cor,
  Tarefa,
  CategoriaTarefa,
  Decisao,
  Convidado,
  GrupoConvidado,
  ParticipanteCerimonia,
  Album,
  Imagem,
  Despesa,
  CategoriaFinanceira,
  Fornecedor,
  EventoCronograma,
  Documento,
  CategoriaDocumento,
  DiarioMemoria
} from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('ngd_user_id') : null;
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  if (userId && !headers.has('x-user-id')) headers.set('x-user-id', userId);

  const res = await fetch(url, {
    ...options,
    headers
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Erro ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Upload
  async uploadFile(file: File): Promise<{ url: string; nome_original: string; nome_arquivo: string; tamanho: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const userId = localStorage.getItem('ngd_user_id');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: userId ? { 'x-user-id': userId } : {},
      body: formData
    });
    if (!res.ok) throw new Error('Falha no upload do arquivo');
    return res.json();
  },

  // Auth & Perfil
  async getMe(userId: string): Promise<{ user: Usuario; casamento: Casamento }> {
    return fetchJson(`/api/auth/me?userId=${userId}`, {
      headers: { 'x-user-id': userId }
    });
  },
  async loginCredentials(data: { email: string; senha?: string }): Promise<{ user: Usuario; casamento: Casamento }> {
    return fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async register(data: { email: string; senha?: string; nome_noivo: string; nome_noiva: string }): Promise<{ user: Usuario; casamento: Casamento }> {
    return fetchJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async getUsuarios(): Promise<Usuario[]> {
    return fetchJson('/api/auth/usuarios');
  },
  async updatePerfil(id: string, data: { nome?: string; nome_noivo?: string; nome_noiva?: string; email?: string; senha?: string; foto?: string }): Promise<Usuario> {
    return fetchJson(`/api/auth/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Casamento
  async getCasamento(): Promise<Casamento | null> {
    return fetchJson('/api/casamento');
  },
  async updateCasamento(data: Partial<Casamento>): Promise<Casamento> {
    return fetchJson('/api/casamento', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async setupCasamento(data: { nome_noivo: string; nome_noiva: string; data_casamento?: string; local?: string }): Promise<Casamento> {
    return fetchJson('/api/casamento/setup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Dashboard
  async getDashboard(): Promise<ResumoDashboard> {
    return fetchJson('/api/dashboard');
  },

  // Paleta
  async getPaleta(): Promise<{ paleta: Paleta | null; cores: Cor[] }> {
    return fetchJson('/api/paleta');
  },
  async updatePaleta(paletaData: any): Promise<any> {
    return fetchJson('/api/paleta', {
      method: 'PUT',
      body: JSON.stringify(paletaData)
    });
  },
  async addCor(data: { nome: string; codigo_hex: string; tipo?: string }): Promise<Cor> {
    return fetchJson('/api/paleta/cores', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateCor(id: string, data: Partial<Cor>): Promise<Cor> {
    return fetchJson(`/api/paleta/cores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteCor(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/paleta/cores/${id}`, { method: 'DELETE' });
  },

  // Tarefas
  async getTarefas(): Promise<{ tarefas: Tarefa[]; categorias: CategoriaTarefa[] }> {
    return fetchJson('/api/tarefas');
  },
  async createTarefa(data: Partial<Tarefa>): Promise<Tarefa> {
    return fetchJson('/api/tarefas', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateTarefa(id: string, data: Partial<Tarefa>): Promise<Tarefa> {
    return fetchJson(`/api/tarefas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteTarefa(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/tarefas/${id}`, { method: 'DELETE' });
  },
  async createCategoriaTarefa(nome: string): Promise<CategoriaTarefa> {
    return fetchJson('/api/tarefas/categorias', {
      method: 'POST',
      body: JSON.stringify({ nome })
    });
  },

  // Decisões
  async getDecisoes(): Promise<Decisao[]> {
    return fetchJson('/api/decisoes');
  },
  async createDecisao(data: Partial<Decisao>): Promise<Decisao> {
    return fetchJson('/api/decisoes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateDecisao(id: string, data: Partial<Decisao>): Promise<Decisao> {
    return fetchJson(`/api/decisoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteDecisao(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/decisoes/${id}`, { method: 'DELETE' });
  },

  // Convidados
  async getConvidados(): Promise<{ convidados: Convidado[]; grupos: GrupoConvidado[] }> {
    return fetchJson('/api/convidados');
  },
  async createConvidado(data: Partial<Convidado>): Promise<Convidado> {
    return fetchJson('/api/convidados', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateConvidado(id: string, data: Partial<Convidado>): Promise<Convidado> {
    return fetchJson(`/api/convidados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteConvidado(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/convidados/${id}`, { method: 'DELETE' });
  },
  async createGrupoConvidado(nome: string): Promise<GrupoConvidado> {
    return fetchJson('/api/convidados/grupos', {
      method: 'POST',
      body: JSON.stringify({ nome })
    });
  },

  // Padrinhos
  async getPadrinhos(): Promise<{ participantes: (ParticipanteCerimonia & { convidado: Convidado | null })[]; convidados: Convidado[] }> {
    return fetchJson('/api/padrinhos');
  },
  async addPadrinho(data: Partial<ParticipanteCerimonia> & { nome?: string }): Promise<ParticipanteCerimonia> {
    return fetchJson('/api/padrinhos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updatePadrinho(id: string, data: Partial<ParticipanteCerimonia>): Promise<ParticipanteCerimonia> {
    return fetchJson(`/api/padrinhos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deletePadrinho(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/padrinhos/${id}`, { method: 'DELETE' });
  },

  // Ideias
  async getAlbuns(): Promise<(Album & { total_imagens: number })[]> {
    return fetchJson('/api/albuns');
  },
  async createAlbum(data: { nome: string; descricao?: string; capa?: string }): Promise<Album> {
    return fetchJson('/api/albuns', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async deleteAlbum(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/albuns/${id}`, { method: 'DELETE' });
  },
  async getAlbumImagens(albumId: string): Promise<Imagem[]> {
    return fetchJson(`/api/albuns/${albumId}/imagens`);
  },
  async addImagem(data: Partial<Imagem>): Promise<Imagem> {
    return fetchJson('/api/imagens', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async toggleFavoritaImagem(id: string): Promise<Imagem> {
    return fetchJson(`/api/imagens/${id}/favorita`, { method: 'PUT' });
  },
  async deleteImagem(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/imagens/${id}`, { method: 'DELETE' });
  },

  // Orçamento & Fornecedores
  async getOrcamento(): Promise<{ despesas: Despesa[]; categorias: CategoriaFinanceira[]; fornecedores: Fornecedor[] }> {
    return fetchJson('/api/orcamento');
  },
  async createDespesa(data: Partial<Despesa>): Promise<Despesa> {
    return fetchJson('/api/despesas', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateDespesa(id: string, data: Partial<Despesa>): Promise<Despesa> {
    return fetchJson(`/api/despesas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteDespesa(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/despesas/${id}`, { method: 'DELETE' });
  },
  async getFornecedores(): Promise<(Fornecedor & { total_despesas: number; valor_total_contratado: number })[]> {
    return fetchJson('/api/fornecedores');
  },
  async createFornecedor(data: Partial<Fornecedor>): Promise<Fornecedor> {
    return fetchJson('/api/fornecedores', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateFornecedor(id: string, data: Partial<Fornecedor>): Promise<Fornecedor> {
    return fetchJson(`/api/fornecedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteFornecedor(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/fornecedores/${id}`, { method: 'DELETE' });
  },

  // Cronograma
  async getCronograma(): Promise<EventoCronograma[]> {
    return fetchJson('/api/cronograma');
  },
  async createEventoCronograma(data: Partial<EventoCronograma>): Promise<EventoCronograma> {
    return fetchJson('/api/cronograma', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async deleteEventoCronograma(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/cronograma/${id}`, { method: 'DELETE' });
  },

  // Documentos
  async getDocumentos(): Promise<{ documentos: Documento[]; categorias: CategoriaDocumento[] }> {
    return fetchJson('/api/documentos');
  },
  async createDocumento(data: Partial<Documento>): Promise<Documento> {
    return fetchJson('/api/documentos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async deleteDocumento(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/documentos/${id}`, { method: 'DELETE' });
  },

  // Diário
  async getDiario(): Promise<DiarioMemoria[]> {
    return fetchJson('/api/diario');
  },
  async createDiarioMemoria(data: Partial<DiarioMemoria>): Promise<DiarioMemoria> {
    return fetchJson('/api/diario', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async deleteDiarioMemoria(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/diario/${id}`, { method: 'DELETE' });
  },

  // Backup
  exportBackupUrl(): string {
    return '/api/backup/export';
  },
  async exportBackup(): Promise<any> {
    return fetchJson('/api/backup/export');
  },
  async importBackup(data: any): Promise<{ success: boolean; message: string }> {
    return fetchJson('/api/backup/import', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
