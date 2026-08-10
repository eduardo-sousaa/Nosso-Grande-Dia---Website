import fs from 'node:fs';
import path from 'node:path';
import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';
import {
  Usuario, Casamento, CasamentoUsuario, Paleta, Cor, Tarefa, CategoriaTarefa,
  Decisao, Convidado, GrupoConvidado, ParticipanteCerimonia, Album, Imagem,
  CategoriaFinanceira, Fornecedor, Despesa, EventoCronograma, CategoriaDocumento,
  Documento, DiarioMemoria, AlertaCalculado, ResumoDashboard
} from '../src/types/index';

interface DatabaseSchema {
  usuarios: Usuario[];
  casamentos: Casamento[];
  casamento_usuarios: CasamentoUsuario[];
  paletas: Paleta[];
  cores: Cor[];
  categorias_tarefa: CategoriaTarefa[];
  tarefas: Tarefa[];
  decisoes: Decisao[];
  grupos_convidados: GrupoConvidado[];
  convidados: Convidado[];
  participantes_cerimonia: ParticipanteCerimonia[];
  albuns: Album[];
  imagens: Imagem[];
  categorias_financeiras: CategoriaFinanceira[];
  fornecedores: Fornecedor[];
  despesas: Despesa[];
  eventos_cronograma: EventoCronograma[];
  categorias_documento: CategoriaDocumento[];
  documentos: Documento[];
  diario: DiarioMemoria[];
}

const DB_FILE = path.join(process.cwd(), 'data_db.json');
const REDIS_KEY = process.env.NGD_REDIS_KEY || 'nosso-grande-dia:v2';

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

function emptyDatabase(): DatabaseSchema {
  return {
    usuarios: [], casamentos: [], casamento_usuarios: [], paletas: [], cores: [],
    categorias_tarefa: [], tarefas: [], decisoes: [], grupos_convidados: [], convidados: [],
    participantes_cerimonia: [], albuns: [], imagens: [], categorias_financeiras: [],
    fornecedores: [], despesas: [], eventos_cronograma: [], categorias_documento: [],
    documentos: [], diario: []
  };
}

class DatabaseStore {
  private data: DatabaseSchema = emptyDatabase();
  private redis = createRedis();
  private readyPromise: Promise<void>;
  private saveQueue: Promise<void> = Promise.resolve();

  constructor() { this.readyPromise = this.load(); }
  public async ready(): Promise<void> { await this.readyPromise; }

  private async load(): Promise<void> {
    if (!this.redis) {
      if (fs.existsSync(DB_FILE)) {
        try {
          this.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
          this.ensureArrayKeys();
          return;
        } catch (err) { console.error('Erro ao carregar banco local:', err); }
      }
      this.saveLocal();
      return;
    }
    try {
      const stored = await this.redis.get<DatabaseSchema>(REDIS_KEY);
      if (stored && typeof stored === 'object') {
        this.data = stored;
        this.ensureArrayKeys();
      } else {
        await this.redis.set(REDIS_KEY, this.data);
      }
    } catch (err) {
      console.error('Erro ao carregar Redis:', err);
    }
  }

  private saveLocal(): void {
    try { fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8'); }
    catch (err) { console.error('Erro ao salvar banco local:', err); }
  }

  private ensureArrayKeys(): void {
    for (const key of Object.keys(emptyDatabase()) as (keyof DatabaseSchema)[]) {
      if (!Array.isArray(this.data[key])) (this.data as any)[key] = [];
    }
  }

  public save(): void {
    if (!this.redis) { this.saveLocal(); return; }
    const snapshot = JSON.parse(JSON.stringify(this.data)) as DatabaseSchema;
    this.saveQueue = this.saveQueue.then(() => this.redis!.set(REDIS_KEY, snapshot)).catch(err => {
      console.error('Erro ao salvar no Redis:', err);
    });
  }

  public async flush(): Promise<void> { await this.saveQueue; }

  public getStore(): DatabaseSchema { return this.data; }

  public getCasamento(id?: string): Casamento | null {
    if (id) return this.data.casamentos.find(c => c.id === id) || null;
    return this.data.casamentos[0] || null;
  }

  public getCasamentoByUsuarioId(usuarioId: string): Casamento | null {
    const link = this.data.casamento_usuarios.find(cu => cu.usuario_id === usuarioId);
    return link ? this.getCasamento(link.casamento_id) : null;
  }

  public updateCasamento(id: string, updates: Partial<Casamento>): Casamento | null {
    const idx = this.data.casamentos.findIndex(c => c.id === id);
    if (idx < 0) return null;
    this.data.casamentos[idx] = { ...this.data.casamentos[idx], ...updates, atualizado_em: new Date().toISOString() };
    this.save();
    return this.data.casamentos[idx];
  }

  public getUsuarioById(id: string): Usuario | null { return this.data.usuarios.find(u => u.id === id) || null; }

  public getPublicUsuario(id: string): Omit<Usuario, 'senha'> | null {
    const user = this.getUsuarioById(id);
    if (!user) return null;
    const { senha: _senha, ...publicUser } = user;
    return publicUser;
  }

  public isUserLinkedToCasamento(usuarioId: string, casamentoId: string): boolean {
    return this.data.casamento_usuarios.some(x => x.usuario_id === usuarioId && x.casamento_id === casamentoId);
  }

  private createWeddingForUser(user: Usuario, now: string): Casamento {
    const id = `casam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const casamento: Casamento = {
      id,
      nome: `Casamento ${user.nome_noivo || 'Noivo'} & ${user.nome_noiva || 'Noiva'}`,
      nome_noivo: user.nome_noivo || '', nome_noiva: user.nome_noiva || '',
      data_casamento: null, horario: null, local: null, endereco: null, cidade: null, estado: null,
      frase: null, imagem_capa: null, configurado: false, criado_em: now, atualizado_em: now
    };
    this.data.casamentos.push(casamento);
    this.data.casamento_usuarios.push({ casamento_id: id, usuario_id: user.id, tipo: 'NOIVO' });
    this.addDefaultDataForWedding(id, now);
    return casamento;
  }

  private addDefaultDataForWedding(casamentoId: string, now: string): void {
    const paletaId = `pal_${casamentoId}`;
    this.data.paletas.push({ id: paletaId, casamento_id: casamentoId, nome: 'Paleta Visual', criada_em: now, cores: [] });

    // A conta nova começa com a paleta vazia; o casal adiciona as próprias cores.


    const taskNames = ['Cerimônia','Festa','Noivos','Convidados','Decoração','Fornecedores','Documentação','Lua de mel','Financeiro','Outros'];
    this.data.categorias_tarefa.push(...taskNames.map((nome, i) => ({ id:`cat_tar_${casamentoId}_${i+1}`, casamento_id:casamentoId, nome, ativa:true })));

    const guestGroups = ['Família do noivo','Família da noiva','Amigos do noivo','Amigos da noiva','Trabalho','Outros'];
    this.data.grupos_convidados.push(...guestGroups.map((nome,i) => ({ id:`grp_guest_${casamentoId}_${i+1}`, casamento_id:casamentoId, nome })));

    const finCats = ['Local & Buffet','Decoração & Flores','Foto & Vídeo','Música & Iluminação','Vestuário & Beleza','Assessoria'];
    this.data.categorias_financeiras.push(...finCats.map((nome,i) => ({ id:`cat_fin_${casamentoId}_${i+1}`, casamento_id:casamentoId, nome })));

    const docCats = ['Contratos','Financeiro','Cerimônia','Fornecedores','Viagem','Outros'];
    this.data.categorias_documento.push(...docCats.map((nome,i) => ({ id:`cat_doc_${casamentoId}_${i+1}`, casamento_id:casamentoId, nome })));
  }

  public registerUsuario(data: { email: string; senha?: string; nome_noivo: string; nome_noiva: string }): { user: Usuario; casamento: Casamento } {
    const now = new Date().toISOString();
    const email = data.email.trim().toLowerCase();
    if (this.data.usuarios.some(u => u.email.toLowerCase() === email)) throw new Error('Já existe uma conta cadastrada com este e-mail.');
    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const user: Usuario = {
      id:userId, nome:`${data.nome_noivo} & ${data.nome_noiva}`, nome_noivo:data.nome_noivo, nome_noiva:data.nome_noiva,
      email, senha:bcrypt.hashSync(data.senha || '123456', 10), foto:null, criado_em:now, atualizado_em:now
    };
    this.data.usuarios.push(user);
    const casamento = this.createWeddingForUser(user, now);
    this.save();
    return { user: this.getPublicUsuario(user.id) as Usuario, casamento };
  }

  public loginUsuario(email: string, senha?: string): { user: Usuario; casamento: Casamento } {
    const user = this.data.usuarios.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) throw new Error('E-mail ou senha incorretos.');
    if (user.senha && senha && !bcrypt.compareSync(senha, user.senha)) throw new Error('E-mail ou senha incorretos.');
    let casamento = this.getCasamentoByUsuarioId(user.id);
    if (!casamento) { casamento = this.createWeddingForUser(user, new Date().toISOString()); this.save(); }
    return { user: this.getPublicUsuario(user.id) as Usuario, casamento };
  }

  public updateUsuario(id: string, updates: Partial<Usuario>): Usuario | null {
    const idx = this.data.usuarios.findIndex(u => u.id === id);
    if (idx < 0) return null;
    const current = this.data.usuarios[idx];
    const newGroom = updates.nome_noivo !== undefined ? updates.nome_noivo : current.nome_noivo;
    const newBride = updates.nome_noiva !== undefined ? updates.nome_noiva : current.nome_noiva;
    const computedName = (newGroom && newBride) ? `${newGroom} & ${newBride}` : (updates.nome || current.nome);
    const safeUpdates:any = { ...updates };
    if (updates.senha) safeUpdates.senha = bcrypt.hashSync(updates.senha, 10);
    this.data.usuarios[idx] = { ...current, ...safeUpdates, nome:computedName, atualizado_em:new Date().toISOString() };
    const casamento = this.getCasamentoByUsuarioId(id);
    if (casamento) {
      casamento.nome_noivo = newGroom || null; casamento.nome_noiva = newBride || null; casamento.nome = `Casamento ${computedName}`; casamento.atualizado_em = new Date().toISOString();
    }
    this.save();
    return this.getPublicUsuario(id) as Usuario;
  }

  public getDashboardResumo(casamentoId: string): ResumoDashboard {
    const casamento = this.getCasamento(casamentoId);

    // Calculate countdown
    let diasRestantes: number | null = null;
    if (casamento && casamento.data_casamento) {
      const targetDate = new Date(casamento.data_casamento + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = targetDate.getTime() - today.getTime();
      diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Tasks calculation
    const tarefasCasamento = this.data.tarefas.filter(t => t.casamento_id === casamentoId);
    const totalTarefas = tarefasCasamento.length;
    const concluidas = tarefasCasamento.filter(t => t.status === 'CONCLUIDA').length;
    const progressoPlanejamento = totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0;

    const tarefasPendentes = tarefasCasamento.filter(t => t.status === 'PENDENTE' || t.status === 'EM_ANDAMENTO').length;
    
    // Overdue tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const tarefasAtrasadas = tarefasCasamento.filter(t => 
      (t.status === 'PENDENTE' || t.status === 'EM_ANDAMENTO') && 
      t.prazo && 
      t.prazo < todayStr
    ).length;

    // Decisions
    const decisoesCasamento = this.data.decisoes.filter(d => d.casamento_id === casamentoId);
    const decisoesPendentes = decisoesCasamento.filter(d => d.status === 'PENDENTE').length;
    const decisoesConcluidas = decisoesCasamento.filter(d => d.status === 'DECIDIDA').length;

    // Guests & Ceremony Participants
    const convidados = this.data.convidados.filter(g => g.casamento_id === casamentoId);
    const totalConvidados = convidados.reduce((acc, curr) => acc + 1 + (curr.acompanhante || 0), 0);

    const participantes = this.data.participantes_cerimonia.filter(p => p.casamento_id === casamentoId);
    const totalPadrinhosMadrinhas = participantes.length;

    // Financial calculations
    const despesas = this.data.despesas.filter(d => d.casamento_id === casamentoId && d.status !== 'CANCELADO');
    const total_planejado = despesas.reduce((acc, d) => acc + (d.valor_previsto || 0), 0);
    const total_contratado = despesas.reduce((acc, d) => acc + (d.valor_final || 0), 0);
    const total_pago = despesas.reduce((acc, d) => acc + (d.valor_pago || 0), 0);
    const total_restante = Math.max(0, total_contratado - total_pago);

    // Upcoming Events
    const proximosEventos = this.data.eventos_cronograma
      .filter(e => e.casamento_id === casamentoId)
      .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))
      .slice(0, 5);

    // Calculate smart alerts
    const alertas: AlertaCalculado[] = [];

    if (tarefasAtrasadas > 0) {
      alertas.push({
        id: 'alt_tar_atrasada',
        tipo: 'TAREFA_ATRASADA',
        titulo: 'Tarefas em atraso',
        mensagem: `Você possui ${tarefasAtrasadas} tarefa(s) pendente(s) com prazo ultrapassado.`,
        nivel: 'URGENTE',
        link: '/planejamento/tarefas'
      });
    }

    if (decisoesPendentes > 0) {
      alertas.push({
        id: 'alt_dec_pendente',
        tipo: 'TAREFA_VENCENDO',
        titulo: 'Decisões a tomar',
        mensagem: `Existem ${decisoesPendentes} decisão(ões) pendente(s) que precisam da atenção do casal.`,
        nivel: 'ALERTA',
        link: '/planejamento/decisoes'
      });
    }

    // Unconfirmed guests check
    const aguardandoRSVP = convidados.filter(g => g.confirmacao === 'AGUARDANDO').length;
    if (aguardandoRSVP > 0) {
      alertas.push({
        id: 'alt_rsvp_pendente',
        tipo: 'CONVIDADO_PENDENTE',
        titulo: 'Confirmações de presença',
        mensagem: `${aguardandoRSVP} convidado(s) ainda não responderam ao convite.`,
        nivel: 'INFO',
        link: '/convidados'
      });
    }

    // Payments due soon
    const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pagamentosProximos = despesas.filter(d => 
      d.status !== 'PAGO' && 
      d.data_vencimento && 
      d.data_vencimento <= nextWeekStr
    );
    if (pagamentosProximos.length > 0) {
      alertas.push({
        id: 'alt_pag_proximo',
        tipo: 'PAGAMENTO_PROXIMO',
        titulo: 'Pagamento próximo do vencimento',
        mensagem: `${pagamentosProximos.length} parcela(s) financeira(s) vencem nos próximos 7 dias.`,
        nivel: 'ALERTA',
        link: '/orcamento'
      });
    }

    return {
      casamento,
      dias_restantes: diasRestantes,
      progresso_planejamento: progressoPlanejamento,
      tarefas_pendentes: tarefasPendentes,
      tarefas_atrasadas: tarefasAtrasadas,
      decisoes_pendentes: decisoesPendentes,
      decisoes_concluidas: decisoesConcluidas,
      total_convidados: totalConvidados,
      total_padrinhos_madrinhas: totalPadrinhosMadrinhas,
      resumo_financeiro: {
        total_planejado,
        total_contratado,
        total_pago,
        total_restante
      },
      proximos_eventos: proximosEventos,
      alertas
    };
  }
}

export const dbStore = new DatabaseStore();
