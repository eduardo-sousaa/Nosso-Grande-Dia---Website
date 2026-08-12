import express from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import { dbStore } from './backend/db.js';

const app = express();

// Export the Express application so Vercel can run it as a serverless function.
export { app };
const PORT = Number(process.env.PORT || 3000);

// Express json middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Vercel Functions have an ephemeral/read-only application filesystem.
// Multer therefore keeps the upload in memory and Vercel Blob stores it durably.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  await dbStore.ready();
  const rawUserId = req.headers['x-user-id'];
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  if (!userId || !dbStore.getUsuarioById(userId)) return res.status(401).json({ error: 'Não autenticado.' });
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  try {
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `nosso-grande-dia/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

    const blob = await put(pathname, req.file.buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: req.file.mimetype
    });

    res.json({
      url: blob.url,
      nome_original: req.file.originalname,
      nome_arquivo: pathname,
      tamanho: req.file.size
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Falha ao armazenar o arquivo.' });
  }
});

function getRequestUserId(req: express.Request): string | null {
  const value = req.headers['x-user-id'];
  return Array.isArray(value) ? value[0] : (value || null);
}

function getRequestCasamento(req: express.Request) {
  const userId = getRequestUserId(req);
  if (!userId) return null;
  return dbStore.getCasamentoByUsuarioId(userId);
}

function safeUpdate(body: Record<string, any>) {
  const { id: _id, casamento_id: _casamentoId, usuario_id: _usuarioId, criado_por: _criadoPor, ...safe } = body || {};
  return safe;
}

// Every private API request must identify the logged-in user.
app.use('/api', async (req, res, next) => {
  if (req.path.startsWith('/auth/login') || req.path.startsWith('/auth/register') || req.path === '/health') {
    return next();
  }
  const userId = getRequestUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado.' });
  await dbStore.ready();
  const user = dbStore.getUsuarioById(userId);
  if (!user) return res.status(401).json({ error: 'Sessão inválida.' });
  next();
});

// Ensure queued Redis writes finish before JSON responses are sent.
app.use('/api', (req, res, next) => {
  const originalJson = res.json.bind(res);
  (res as any).json = (body: any) => {
    return dbStore.flush().then(() => originalJson(body)).catch((err) => {
      console.error('Erro ao finalizar gravação:', err);
      return originalJson(body);
    });
  };
  next();
});

// API health check
app.get('/api/health', async (_req, res) => {
  await dbStore.ready();
  res.json({
    ok: true,
    storage: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL ? 'redis' : 'local'
  });
});

/* ==========================================================================
   REST API ROUTES
   ========================================================================== */

// 1. Auth & Users
app.get('/api/auth/me', (req, res) => {
  const userId = req.headers['x-user-id'] as string || req.query.userId as string;
  if (!userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  const user = dbStore.getPublicUsuario(userId);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }
  const casamento = dbStore.getCasamentoByUsuarioId(userId);
  res.json({ user, casamento });
});

app.post('/api/auth/register', async (req, res) => {
  await dbStore.ready();
  const { email, senha, nome_noivo, nome_noiva } = req.body;
  if (!email || !nome_noivo || !nome_noiva) {
    return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios (Nome do noivo, Noiva e E-mail).' });
  }
  try {
    const result = dbStore.registerUsuario({ email, senha, nome_noivo, nome_noiva });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao registrar usuário' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  await dbStore.ready();
  const { email, senha, userId } = req.body;
  
  // If legacy userId provided
  if (userId && !email) {
    const user = dbStore.getPublicUsuario(userId);
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    const casamento = dbStore.getCasamentoByUsuarioId(userId);
    return res.json({ user, casamento });
  }

  if (!email) {
    return res.status(400).json({ error: 'Informe o e-mail de acesso.' });
  }

  try {
    const result = dbStore.loginUsuario(email, senha);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'E-mail ou senha inválidos' });
  }
});

app.get('/api/auth/usuarios', (req, res) => {
  const store = dbStore.getStore();
  const usuarios = store.usuarios.map(u => dbStore.getPublicUsuario(u.id)).filter(Boolean);
  res.json(usuarios);
});

app.put('/api/auth/usuarios/:id', (req, res) => {
  const currentUserId = getRequestUserId(req);
  if (!currentUserId || currentUserId !== req.params.id) {
    return res.status(403).json({ error: 'Você só pode editar o seu próprio perfil.' });
  }
  const { nome, nome_noivo, nome_noiva, email, senha, foto } = req.body;
  const updated = dbStore.updateUsuario(req.params.id, {
    ...(nome !== undefined && { nome }),
    ...(nome_noivo !== undefined && { nome_noivo }),
    ...(nome_noiva !== undefined && { nome_noiva }),
    ...(email !== undefined && { email }),
    ...(senha !== undefined && senha !== '' && { senha }),
    ...(foto !== undefined && { foto })
  });
  if (!updated) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  res.json(updated);
});

// 2. Casamento (Wedding Settings)
app.get('/api/casamento', (req, res) => {
  const casamento = getRequestCasamento(req);
  res.json(casamento);
});

app.put('/api/casamento', (req, res) => {
  const casamento = getRequestCasamento(req);
  if (!casamento) return res.status(404).json({ error: 'Casamento não encontrado' });
  const updated = dbStore.updateCasamento(casamento.id, safeUpdate(req.body));
  res.json(updated);
});

app.post('/api/casamento/setup', (req, res) => {
  const casamento = getRequestCasamento(req);
  if (!casamento) return res.status(404).json({ error: 'Casamento não cadastrado.' });
  const { nome_noivo, nome_noiva, data_casamento, local } = req.body;
  const updated = dbStore.updateCasamento(casamento.id, {
    nome: `Casamento ${nome_noivo || casamento.nome_noivo || 'Noivo'} & ${nome_noiva || casamento.nome_noiva || 'Noiva'}`,
    nome_noivo: nome_noivo || casamento.nome_noivo,
    nome_noiva: nome_noiva || casamento.nome_noiva,
    data_casamento: data_casamento !== undefined ? data_casamento : casamento.data_casamento,
    local: local !== undefined ? local : casamento.local,
    configurado: true
  });
  res.json(updated);
});

// 3. Dashboard Resumo
app.get('/api/dashboard', (req, res) => {
  const casamento = getRequestCasamento(req);
  if (!casamento) return res.status(404).json({ error: 'Casamento não cadastrado' });
  const resumo = dbStore.getDashboardResumo(casamento.id);
  res.json(resumo);
});

// 4. Paleta & Cores
app.get('/api/paleta', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  if (!casamento) return res.json({ paleta: null, cores: [] });
  const paleta = store.paletas.find(p => p.casamento_id === casamento.id) || null;
  const cores = paleta ? store.cores.filter(c => c.paleta_id === paleta.id).sort((a, b) => a.ordem - b.ordem) : [];
  res.json({ paleta, cores });
});

app.post('/api/paleta/cores', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  let paleta = store.paletas.find(p => p.casamento_id === casamento?.id);
  if (!paleta && casamento) {
    paleta = {
      id: `pal_${Date.now()}`,
      casamento_id: casamento.id,
      nome: 'Nossa Paleta de Cores',
      criada_em: new Date().toISOString(),
      cores: []
    };
    store.paletas.push(paleta);
  }

  const newCor = {
    id: `cor_${Date.now()}`,
    paleta_id: paleta!.id,
    nome: req.body.nome || 'Nova Cor',
    codigo_hex: req.body.codigo_hex || '#800020',
    ordem: store.cores.filter(c => c.paleta_id === paleta!.id).length + 1,
    tipo: req.body.tipo || 'OUTRA'
  };
  store.cores.push(newCor);
  dbStore.save();
  res.json(newCor);
});

app.put('/api/paleta/cores/:id', (req, res) => {
  const store = dbStore.getStore();
  const idx = store.cores.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Cor não encontrada' });
  store.cores[idx] = { ...store.cores[idx], ...req.body };
  dbStore.save();
  res.json(store.cores[idx]);
});

app.delete('/api/paleta/cores/:id', (req, res) => {
  const store = dbStore.getStore();
  store.cores = store.cores.filter(c => c.id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

// 5. Tarefas & Categorias
app.get('/api/tarefas', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const tarefas = store.tarefas.filter(t => t.casamento_id === casamento?.id);
  const categorias = store.categorias_tarefa.filter(c => c.casamento_id === casamento?.id && c.ativa);
  res.json({ tarefas, categorias });
});

app.post('/api/tarefas', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const now = new Date().toISOString();
  const newTarefa = {
    id: `tar_${Date.now()}`,
    casamento_id: casamento!.id,
    titulo: req.body.titulo,
    descricao: req.body.descricao || '',
    categoria_id: req.body.categoria_id,
    responsavel_id: req.body.responsavel_id || null,
    prazo: req.body.prazo || null,
    status: req.body.status || 'PENDENTE',
    prioridade: req.body.prioridade || 'MEDIA',
    criado_por: req.body.criado_por || getRequestUserId(req)!,
    criado_em: now
  };
  store.tarefas.push(newTarefa);
  dbStore.save();
  res.json(newTarefa);
});

app.put('/api/tarefas/:id', (req, res) => {
  const store = dbStore.getStore();
  const idx = store.tarefas.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Tarefa não encontrada' });
  
  const oldStatus = store.tarefas[idx].status;
  const newStatus = req.body.status || oldStatus;
  
  store.tarefas[idx] = {
    ...store.tarefas[idx],
    ...safeUpdate(req.body),
    concluido_em: newStatus === 'CONCLUIDA' && oldStatus !== 'CONCLUIDA' ? new Date().toISOString() : store.tarefas[idx].concluido_em
  };
  dbStore.save();
  res.json(store.tarefas[idx]);
});

app.delete('/api/tarefas/:id', (req, res) => {
  const store = dbStore.getStore();
  store.tarefas = store.tarefas.filter(t => t.id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

app.post('/api/tarefas/categorias', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const newCat = {
    id: `cat_tar_${Date.now()}`,
    casamento_id: casamento!.id,
    nome: req.body.nome,
    ativa: true
  };
  store.categorias_tarefa.push(newCat);
  dbStore.save();
  res.json(newCat);
});

// 6. Decisões
app.get('/api/decisoes', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const decisoes = store.decisoes.filter(d => d.casamento_id === casamento?.id);
  res.json(decisoes);
});

app.post('/api/decisoes', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const now = new Date().toISOString();
  const newDecisao = {
    id: `dec_${Date.now()}`,
    casamento_id: casamento!.id,
    titulo: req.body.titulo,
    descricao: req.body.descricao || '',
    categoria_id: req.body.categoria_id || null,
    status: req.body.status || 'PENDENTE',
    responsavel_id: req.body.responsavel_id || null,
    criado_por: req.body.criado_por || getRequestUserId(req)!,
    data_decisao: req.body.status === 'DECIDIDA' ? now.split('T')[0] : undefined,
    criado_em: now
  };
  store.decisoes.push(newDecisao);
  dbStore.save();
  res.json(newDecisao);
});

app.put('/api/decisoes/:id', (req, res) => {
  const store = dbStore.getStore();
  const idx = store.decisoes.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Decisão não encontrada' });

  const isDecided = req.body.status === 'DECIDIDA';
  store.decisoes[idx] = {
    ...store.decisoes[idx],
    ...safeUpdate(req.body),
    data_decisao: isDecided ? (store.decisoes[idx].data_decisao || new Date().toISOString().split('T')[0]) : undefined
  };
  dbStore.save();
  res.json(store.decisoes[idx]);
});

app.delete('/api/decisoes/:id', (req, res) => {
  const store = dbStore.getStore();
  store.decisoes = store.decisoes.filter(d => d.id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

// 7. Convidados & Grupos
app.get('/api/convidados', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const convidados = store.convidados.filter(g => g.casamento_id === casamento?.id);
  const grupos = store.grupos_convidados.filter(g => g.casamento_id === casamento?.id);
  res.json({ convidados, grupos });
});

app.post('/api/convidados', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const now = new Date().toISOString();
  const newConvidado = {
    id: `gst_${Date.now()}`,
    casamento_id: casamento!.id,
    nome: req.body.nome,
    sobrenome: req.body.sobrenome || '',
    telefone: req.body.telefone || '',
    email: req.body.email || '',
    grupo_id: req.body.grupo_id || null,
    convite_status: req.body.convite_status || 'NAO_ENVIADO',
    confirmacao: req.body.confirmacao || 'AGUARDANDO',
    acompanhante: Number(req.body.acompanhante) || 0,
    observacao: req.body.observacao || '',
    criado_em: now,
    atualizado_em: now
  };
  store.convidados.push(newConvidado);
  dbStore.save();
  res.json(newConvidado);
});

app.put('/api/convidados/:id', (req, res) => {
  const store = dbStore.getStore();
  const idx = store.convidados.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Convidado não encontrado' });
  store.convidados[idx] = {
    ...store.convidados[idx],
    ...safeUpdate(req.body),
    atualizado_em: new Date().toISOString()
  };
  dbStore.save();
  res.json(store.convidados[idx]);
});

app.delete('/api/convidados/:id', (req, res) => {
  const store = dbStore.getStore();
  store.convidados = store.convidados.filter(g => g.id !== req.params.id);
  // also clean up ceremony participant linkage
  store.participantes_cerimonia = store.participantes_cerimonia.filter(p => p.convidado_id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

app.post('/api/convidados/grupos', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const newGrupo = {
    id: `grp_guest_${Date.now()}`,
    casamento_id: casamento!.id,
    nome: req.body.nome
  };
  store.grupos_convidados.push(newGrupo);
  dbStore.save();
  res.json(newGrupo);
});

// 8. Padrinhos e Madrinhas
app.get('/api/padrinhos', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const participantes = store.participantes_cerimonia.filter(p => p.casamento_id === casamento?.id);
  const convidados = store.convidados.filter(g => g.casamento_id === casamento?.id);
  
  // Attach full convidado object
  const result = participantes.map(p => ({
    ...p,
    convidado: convidados.find(g => g.id === p.convidado_id) || null
  }));

  res.json({ participantes: result, convidados });
});

app.post('/api/padrinhos', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  
  let convidadoId = req.body.convidado_id;

  // If name provided directly, create convidado automatically
  if (!convidadoId && req.body.nome) {
    const newConvidado = {
      id: `conv_${Date.now()}`,
      casamento_id: casamento!.id,
      nome: req.body.nome,
      sobrenome: req.body.sobrenome || '',
      telefone: req.body.telefone || '',
      email: req.body.email || '',
      convite_status: 'NAO_ENVIADO' as const,
      confirmacao: 'AGUARDANDO' as const,
      acompanhante: 0,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };
    store.convidados.push(newConvidado);
    convidadoId = newConvidado.id;
  }

  if (!convidadoId) {
    return res.status(400).json({ error: 'Informe o nome do padrinho/madrinha ou selecione um convidado.' });
  }

  // check if already assigned
  const existing = store.participantes_cerimonia.find(p => p.convidado_id === convidadoId && p.casamento_id === casamento?.id);
  if (existing) {
    return res.status(400).json({ error: 'Esta pessoa já está cadastrada na lista da cerimônia.' });
  }

  const newPart = {
    id: `part_${Date.now()}`,
    casamento_id: casamento!.id,
    convidado_id: convidadoId,
    tipo: req.body.tipo || 'PADRINHO',
    lado: 'NOIVO' as const, // default side unused now
    status_convite: req.body.status_convite || 'NAO_ENVIADO',
    confirmado: req.body.confirmado !== undefined ? req.body.confirmado : true,
    observacao: req.body.observacao || ''
  };
  store.participantes_cerimonia.push(newPart);
  dbStore.save();

  // Return with attached convidado
  const convidado = store.convidados.find(g => g.id === convidadoId) || null;
  res.json({
    ...newPart,
    convidado
  });
});

app.put('/api/padrinhos/:id', (req, res) => {
  const store = dbStore.getStore();
  const idx = store.participantes_cerimonia.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Participante não encontrado' });
  store.participantes_cerimonia[idx] = {
    ...store.participantes_cerimonia[idx],
    ...req.body
  };
  dbStore.save();
  res.json(store.participantes_cerimonia[idx]);
});

app.delete('/api/padrinhos/:id', (req, res) => {
  const store = dbStore.getStore();
  store.participantes_cerimonia = store.participantes_cerimonia.filter(p => p.id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

// 9. Mural de Ideias (Álbuns & Imagens)
app.get('/api/albuns', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const albuns = store.albuns.filter(a => a.casamento_id === casamento?.id);
  const result = albuns.map(album => {
    const albumImgs = store.imagens.filter(img => img.album_id === album.id);
    return {
      ...album,
      total_imagens: albumImgs.length,
      capa: album.capa || (albumImgs.length > 0 ? albumImgs[0].caminho : undefined)
    };
  });
  res.json(result);
});

app.post('/api/albuns', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const now = new Date().toISOString();
  const newAlbum = {
    id: `alb_${Date.now()}`,
    casamento_id: casamento!.id,
    nome: req.body.nome,
    descricao: req.body.descricao || '',
    capa: req.body.capa || undefined,
    criado_por: req.body.criado_por || getRequestUserId(req)!,
    criado_em: now
  };
  store.albuns.push(newAlbum);
  dbStore.save();
  res.json(newAlbum);
});

app.delete('/api/albuns/:id', (req, res) => {
  const store = dbStore.getStore();
  store.albuns = store.albuns.filter(a => a.id !== req.params.id);
  store.imagens = store.imagens.filter(i => i.album_id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

app.get('/api/albuns/:id/imagens', (req, res) => {
  const store = dbStore.getStore();
  const imagens = store.imagens.filter(i => i.album_id === req.params.id);
  res.json(imagens);
});

app.post('/api/imagens', (req, res) => {
  const store = dbStore.getStore();
  const now = new Date().toISOString();
  const newImg = {
    id: `img_${Date.now()}`,
    album_id: req.body.album_id,
    nome_original: req.body.nome_original || 'imagem.jpg',
    nome_arquivo: req.body.nome_arquivo || 'imagem.jpg',
    caminho: req.body.caminho,
    descricao: req.body.descricao || '',
    favorita: false,
    usuario_id: req.body.usuario_id || getRequestUserId(req)!,
    criado_em: now
  };
  store.imagens.push(newImg);
  dbStore.save();
  res.json(newImg);
});

app.put('/api/imagens/:id/favorita', (req, res) => {
  const store = dbStore.getStore();
  const idx = store.imagens.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Imagem não encontrada' });
  store.imagens[idx].favorita = !store.imagens[idx].favorita;
  dbStore.save();
  res.json(store.imagens[idx]);
});

app.delete('/api/imagens/:id', (req, res) => {
  const store = dbStore.getStore();
  store.imagens = store.imagens.filter(i => i.id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

// 10. Orçamento e Fornecedores
app.get('/api/orcamento', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const despesas = store.despesas.filter(d => d.casamento_id === casamento?.id);
  const categorias = store.categorias_financeiras.filter(c => c.casamento_id === casamento?.id);
  const fornecedores = store.fornecedores.filter(f => f.casamento_id === casamento?.id);

  res.json({ despesas, categorias, fornecedores });
});

app.post('/api/despesas', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const now = new Date().toISOString();
  const newDespesa = {
    id: `desp_${Date.now()}`,
    casamento_id: casamento!.id,
    categoria_id: req.body.categoria_id,
    fornecedor_id: req.body.fornecedor_id || undefined,
    descricao: req.body.descricao,
    valor_previsto: Number(req.body.valor_previsto) || 0,
    valor_final: Number(req.body.valor_final) || 0,
    valor_pago: Number(req.body.valor_pago) || 0,
    data_vencimento: req.body.data_vencimento || undefined,
    status: req.body.status || 'PLANEJADO',
    observacao: req.body.observacao || '',
    criado_em: now,
    atualizado_em: now
  };
  store.despesas.push(newDespesa);
  dbStore.save();
  res.json(newDespesa);
});

app.put('/api/despesas/:id', (req, res) => {
  const store = dbStore.getStore();
  const idx = store.despesas.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Despesa não encontrada' });
  store.despesas[idx] = {
    ...store.despesas[idx],
    ...safeUpdate(req.body),
    valor_previsto: req.body.valor_previsto !== undefined ? Number(req.body.valor_previsto) : store.despesas[idx].valor_previsto,
    valor_final: req.body.valor_final !== undefined ? Number(req.body.valor_final) : store.despesas[idx].valor_final,
    valor_pago: req.body.valor_pago !== undefined ? Number(req.body.valor_pago) : store.despesas[idx].valor_pago,
    atualizado_em: new Date().toISOString()
  };
  dbStore.save();
  res.json(store.despesas[idx]);
});

app.delete('/api/despesas/:id', (req, res) => {
  const store = dbStore.getStore();
  store.despesas = store.despesas.filter(d => d.id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

app.get('/api/fornecedores', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const fornecedores = store.fornecedores.filter(f => f.casamento_id === casamento?.id);
  
  // Include associated expenses count and total contracted
  const result = fornecedores.map(f => {
    const fDespesas = store.despesas.filter(d => d.fornecedor_id === f.id);
    return {
      ...f,
      total_despesas: fDespesas.length,
      valor_total_contratado: fDespesas.reduce((acc, curr) => acc + (curr.valor_final || 0), 0)
    };
  });
  res.json(result);
});

app.post('/api/fornecedores', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const now = new Date().toISOString();
  const newForn = {
    id: `forn_${Date.now()}`,
    casamento_id: casamento!.id,
    nome: req.body.nome,
    categoria: req.body.categoria || 'Geral',
    telefone: req.body.telefone || '',
    email: req.body.email || '',
    instagram: req.body.instagram || '',
    site: req.body.site || '',
    observacao: req.body.observacao || '',
    criado_em: now,
    atualizado_em: now
  };
  store.fornecedores.push(newForn);
  dbStore.save();
  res.json(newForn);
});

app.put('/api/fornecedores/:id', (req, res) => {
  const store = dbStore.getStore();
  const idx = store.fornecedores.findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Fornecedor não encontrado' });
  store.fornecedores[idx] = {
    ...store.fornecedores[idx],
    ...safeUpdate(req.body),
    atualizado_em: new Date().toISOString()
  };
  dbStore.save();
  res.json(store.fornecedores[idx]);
});

app.delete('/api/fornecedores/:id', (req, res) => {
  const store = dbStore.getStore();
  store.fornecedores = store.fornecedores.filter(f => f.id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

// 11. Cronograma
app.get('/api/cronograma', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const eventos = store.eventos_cronograma
    .filter(e => e.casamento_id === casamento?.id)
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
  res.json(eventos);
});

app.post('/api/cronograma', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const now = new Date().toISOString();
  const newEvt = {
    id: `evt_${Date.now()}`,
    casamento_id: casamento!.id,
    titulo: req.body.titulo,
    descricao: req.body.descricao || '',
    data_inicio: req.body.data_inicio,
    data_fim: req.body.data_fim || undefined,
    tipo: req.body.tipo || 'EVENTO',
    criado_por: req.body.criado_por || getRequestUserId(req)!,
    criado_em: now
  };
  store.eventos_cronograma.push(newEvt);
  dbStore.save();
  res.json(newEvt);
});

app.delete('/api/cronograma/:id', (req, res) => {
  const store = dbStore.getStore();
  store.eventos_cronograma = store.eventos_cronograma.filter(e => e.id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

// 12. Documentos
app.get('/api/documentos', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const documentos = store.documentos.filter(d => d.casamento_id === casamento?.id);
  const categorias = store.categorias_documento.filter(c => c.casamento_id === casamento?.id);
  res.json({ documentos, categorias });
});

app.post('/api/documentos', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const now = new Date().toISOString();
  const newDoc = {
    id: `doc_${Date.now()}`,
    casamento_id: casamento!.id,
    categoria_id: req.body.categoria_id,
    nome: req.body.nome,
    descricao: req.body.descricao || '',
    nome_arquivo: req.body.nome_arquivo,
    caminho: req.body.caminho,
    usuario_id: req.body.usuario_id || getRequestUserId(req)!,
    criado_em: now
  };
  store.documentos.push(newDoc);
  dbStore.save();
  res.json(newDoc);
});

app.delete('/api/documentos/:id', (req, res) => {
  const store = dbStore.getStore();
  store.documentos = store.documentos.filter(d => d.id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

// 13. Diário (Memórias)
app.get('/api/diario', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const memorias = store.diario
    .filter(d => d.casamento_id === casamento?.id)
    .sort((a, b) => b.data_memoria.localeCompare(a.data_memoria));
  res.json(memorias);
});

app.post('/api/diario', (req, res) => {
  const store = dbStore.getStore();
  const casamento = getRequestCasamento(req);
  const now = new Date().toISOString();
  const newMemoria = {
    id: `dia_${Date.now()}`,
    casamento_id: casamento!.id,
    titulo: req.body.titulo,
    conteudo: req.body.conteudo,
    data_memoria: req.body.data_memoria || now.split('T')[0],
    usuario_id: req.body.usuario_id || getRequestUserId(req)!,
    imagens: Array.isArray(req.body.imagens) ? req.body.imagens : [],
    criado_em: now,
    atualizado_em: now
  };
  store.diario.push(newMemoria);
  dbStore.save();
  res.json(newMemoria);
});

app.delete('/api/diario/:id', (req, res) => {
  const store = dbStore.getStore();
  store.diario = store.diario.filter(d => d.id !== req.params.id);
  dbStore.save();
  res.json({ success: true });
});

// 14. Backup Export & Import
app.get('/api/backup/export', (req, res) => {
  const casamento = getRequestCasamento(req);
  const userId = getRequestUserId(req);
  if (!casamento || !userId) return res.status(404).json({ error: 'Casamento não encontrado.' });
  const store = dbStore.getStore();
  const paletaIds = store.paletas.filter(p => p.casamento_id === casamento.id).map(p => p.id);
  const backup = {
    version: 2,
    exported_at: new Date().toISOString(),
    usuarios: store.usuarios.filter(u => u.id === userId).map(({ senha, ...u }) => u),
    casamentos: store.casamentos.filter(c => c.id === casamento.id),
    casamento_usuarios: store.casamento_usuarios.filter(cu => cu.casamento_id === casamento.id),
    paletas: store.paletas.filter(p => p.casamento_id === casamento.id),
    cores: store.cores.filter(c => paletaIds.includes(c.paleta_id)),
    categorias_tarefa: store.categorias_tarefa.filter(x => x.casamento_id === casamento.id),
    tarefas: store.tarefas.filter(x => x.casamento_id === casamento.id),
    decisoes: store.decisoes.filter(x => x.casamento_id === casamento.id),
    grupos_convidados: store.grupos_convidados.filter(x => x.casamento_id === casamento.id),
    convidados: store.convidados.filter(x => x.casamento_id === casamento.id),
    participantes_cerimonia: store.participantes_cerimonia.filter(x => x.casamento_id === casamento.id),
    albuns: store.albuns.filter(x => x.casamento_id === casamento.id),
    imagens: store.imagens.filter(x => {
      const albumIds = new Set(store.albuns.filter(a => a.casamento_id === casamento.id).map(a => a.id));
      return albumIds.has(x.album_id);
    }),
    categorias_financeiras: store.categorias_financeiras.filter(x => x.casamento_id === casamento.id),
    fornecedores: store.fornecedores.filter(x => x.casamento_id === casamento.id),
    despesas: store.despesas.filter(x => x.casamento_id === casamento.id),
    eventos_cronograma: store.eventos_cronograma.filter(x => x.casamento_id === casamento.id),
    categorias_documento: store.categorias_documento.filter(x => x.casamento_id === casamento.id),
    documentos: store.documentos.filter(x => x.casamento_id === casamento.id),
    diario: store.diario.filter(x => x.casamento_id === casamento.id)
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=nosso_grande_dia_backup_${Date.now()}.json`);
  res.send(JSON.stringify(backup, null, 2));
});

app.post('/api/backup/import', (req, res) => {
  try {
    const currentCasamento = getRequestCasamento(req);
    const userId = getRequestUserId(req);
    const backupData = req.body;
    if (!currentCasamento || !userId || !backupData || !Array.isArray(backupData.casamentos) || backupData.casamentos.length !== 1) {
      return res.status(400).json({ error: 'Arquivo de backup inválido ou incompatível.' });
    }
    const importedWedding = backupData.casamentos[0];
    const store = dbStore.getStore();
    const currentId = currentCasamento.id;
    const newId = importedWedding.id || currentId;

    const scopedKeys = [
      'paletas','categorias_tarefa','tarefas','decisoes','grupos_convidados','convidados',
      'participantes_cerimonia','albuns','categorias_financeiras','fornecedores','despesas',
      'eventos_cronograma','categorias_documento','documentos','diario'
    ];
    const oldPaletaIds = new Set(store.paletas.filter(p => p.casamento_id === currentId).map(p => p.id));
    const oldAlbumIds = new Set(store.albuns.filter(a => a.casamento_id === currentId).map(a => a.id));
    for (const key of scopedKeys) {
      const list = (store as any)[key] as any[];
      (store as any)[key] = list.filter(item => item.casamento_id !== currentId);
    }
    store.cores = store.cores.filter(c => !oldPaletaIds.has(c.paleta_id));
    store.imagens = store.imagens.filter(img => !oldAlbumIds.has(img.album_id));

    store.casamentos = store.casamentos.filter(c => c.id !== currentId && c.id !== newId);
    store.casamentos.push({ ...importedWedding, id: newId });
    store.casamento_usuarios = store.casamento_usuarios.filter(cu => cu.usuario_id !== userId && cu.casamento_id !== currentId && cu.casamento_id !== newId);
    store.casamento_usuarios.push({ casamento_id: newId, usuario_id: userId, tipo: 'NOIVO' });

    for (const key of scopedKeys) {
      const incoming = Array.isArray(backupData[key]) ? backupData[key] : [];
      (store as any)[key].push(...incoming.map((item:any) => ({ ...item, casamento_id: newId })));
    }
    const importedImages = Array.isArray(backupData.imagens) ? backupData.imagens : [];
    store.imagens.push(...importedImages);
    const importedPaletas = Array.isArray(backupData.paletas) ? backupData.paletas : [];
    const paletaIds = new Set(importedPaletas.map((p:any) => p.id));
    store.cores.push(...(Array.isArray(backupData.cores) ? backupData.cores.filter((c:any) => paletaIds.has(c.paleta_id)) : []));

    dbStore.save();
    res.json({ success: true, message: 'Backup restaurado com sucesso!' });
  } catch (err) {
    console.error('Backup import error:', err);
    res.status(500).json({ error: 'Falha ao importar backup.' });
  }
});
