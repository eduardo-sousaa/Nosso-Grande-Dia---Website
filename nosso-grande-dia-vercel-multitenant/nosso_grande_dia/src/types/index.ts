export type UsuarioTipo = 'NOIVO' | 'NOIVA';

export interface Usuario {
  id: string;
  nome: string;
  nome_noivo?: string;
  nome_noiva?: string;
  email: string;
  senha?: string;
  foto?: string;
  tipo?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Casamento {
  id: string;
  nome: string;
  nome_noivo: string;
  nome_noiva: string;
  data_casamento: string | null; // YYYY-MM-DD or null
  horario: string | null;
  local: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  frase: string | null;
  imagem_capa: string | null;
  configurado?: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface CasamentoUsuario {
  casamento_id: string;
  usuario_id: string;
  tipo: UsuarioTipo;
}

export type CorTipo = 'PRIMARIA' | 'SECUNDARIA' | 'DESTAQUE' | 'FUNDO' | 'OUTRA';

export interface Cor {
  id: string;
  paleta_id: string;
  nome: string;
  codigo_hex: string;
  ordem: number;
  tipo: CorTipo;
}

export interface Paleta {
  id: string;
  casamento_id: string;
  nome: string;
  criada_em: string;
  cores: Cor[];
}

export type TarefaStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
export type TarefaPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface CategoriaTarefa {
  id: string;
  casamento_id: string;
  nome: string;
  ativa: boolean;
}

export interface Tarefa {
  id: string;
  casamento_id: string;
  titulo: string;
  descricao?: string;
  categoria_id: string;
  responsavel_id?: string;
  prazo?: string; // YYYY-MM-DD
  status: TarefaStatus;
  prioridade: TarefaPrioridade;
  criado_por: string;
  criado_em: string;
  concluido_em?: string;
}

export type DecisaoStatus = 'PENDENTE' | 'DECIDIDA';

export interface Decisao {
  id: string;
  casamento_id: string;
  titulo: string;
  descricao?: string;
  categoria_id?: string;
  status: DecisaoStatus;
  responsavel_id?: string;
  criado_por: string;
  data_decisao?: string;
  criado_em: string;
}

export type ConviteStatus = 'NAO_ENVIADO' | 'ENVIADO';
export type ConfirmacaoStatus = 'AGUARDANDO' | 'CONFIRMADO' | 'RECUSADO';

export interface GrupoConvidado {
  id: string;
  casamento_id: string;
  nome: string;
}

export interface Convidado {
  id: string;
  casamento_id: string;
  nome: string;
  sobrenome?: string;
  telefone?: string;
  email?: string;
  grupo_id?: string;
  convite_status: ConviteStatus;
  confirmacao: ConfirmacaoStatus;
  acompanhante: number; // quantidade de acompanhantes
  observacao?: string;
  criado_em: string;
  atualizado_em: string;
}

export type ParticipanteTipo = 'PADRINHO' | 'MADRINHA';
export type ParticipanteLado = 'NOIVO' | 'NOIVA';

export interface ParticipanteCerimonia {
  id: string;
  casamento_id: string;
  convidado_id: string;
  tipo: ParticipanteTipo;
  lado: ParticipanteLado;
  status_convite: ConviteStatus;
  confirmado: boolean;
  observacao?: string;
}

export interface Album {
  id: string;
  casamento_id: string;
  nome: string;
  descricao?: string;
  capa?: string;
  criado_por: string;
  criado_em: string;
}

export interface Imagem {
  id: string;
  album_id: string;
  nome_original: string;
  nome_arquivo: string;
  caminho: string;
  descricao?: string;
  favorita: boolean;
  usuario_id: string;
  criado_em: string;
}

export interface CategoriaFinanceira {
  id: string;
  casamento_id: string;
  nome: string;
}

export interface Fornecedor {
  id: string;
  casamento_id: string;
  nome: string;
  categoria: string;
  telefone?: string;
  email?: string;
  instagram?: string;
  site?: string;
  observacao?: string;
  criado_em: string;
  atualizado_em: string;
}

export type DespesaStatus = 'PLANEJADO' | 'CONTRATADO' | 'PARCIALMENTE_PAGO' | 'PAGO' | 'CANCELADO';

export interface Despesa {
  id: string;
  casamento_id: string;
  categoria_id: string;
  fornecedor_id?: string;
  descricao: string;
  valor_previsto: number;
  valor_final: number;
  valor_pago: number;
  data_vencimento?: string;
  status: DespesaStatus;
  observacao?: string;
  criado_em: string;
  atualizado_em: string;
}

export type EventoTipo = 'EVENTO' | 'PRAZO' | 'COMPROMISSO';

export interface EventoCronograma {
  id: string;
  casamento_id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string; // ISO datetime or YYYY-MM-DD HH:mm
  data_fim?: string;
  tipo: EventoTipo;
  criado_por: string;
  criado_em: string;
}

export interface CategoriaDocumento {
  id: string;
  casamento_id: string;
  nome: string;
}

export interface Documento {
  id: string;
  casamento_id: string;
  categoria_id: string;
  nome: string;
  descricao?: string;
  nome_arquivo: string;
  caminho: string;
  usuario_id: string;
  criado_em: string;
}

export interface DiarioMemoria {
  id: string;
  casamento_id: string;
  titulo: string;
  conteudo: string;
  data_memoria: string; // YYYY-MM-DD
  usuario_id: string;
  imagens: string[]; // array of image paths or image IDs
  criado_em: string;
  atualizado_em: string;
}

export interface AlertaCalculado {
  id: string;
  tipo: 'TAREFA_ATRASADA' | 'TAREFA_VENCENDO' | 'PAGAMENTO_PROXIMO' | 'CONVIDADO_PENDENTE';
  titulo: string;
  mensagem: string;
  nivel: 'URGENTE' | 'ALERTA' | 'INFO';
  link?: string;
}

export interface ResumoDashboard {
  casamento: Casamento | null;
  dias_restantes: number | null; // calculated dynamically
  progresso_planejamento: number; // 0..100
  tarefas_pendentes: number;
  tarefas_atrasadas: number;
  decisoes_pendentes: number;
  decisoes_concluidas: number;
  total_convidados: number;
  total_padrinhos_madrinhas: number;
  resumo_financeiro: {
    total_planejado: number;
    total_contratado: number;
    total_pago: number;
    total_restante: number;
  };
  proximos_eventos: EventoCronograma[];
  alertas: AlertaCalculado[];
}
