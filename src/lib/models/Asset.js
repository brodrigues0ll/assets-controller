import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const AssetSchema = new mongoose.Schema({
  assetId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },

  // ── Identificação ─────────────────────────────────────────────────────────
  // "Denominação do imobilizado" na planilha (ex: MONITOR DE VIDEO, MICROCOMPUTADOR)
  tipoEquipamento: {
    type: String,
    trim: true
  },
  // "Modelo" na planilha (ex: DC5750, 740N/LCD) — antes chamado "Subtipo / Modelo" na UI
  subtipo: {
    type: String,
    required: [true, 'Modelo é obrigatório'],
    trim: true
  },
  fabricante: {
    type: String,
    trim: true
  },
  // "Plaqueta" na planilha — etiqueta física colada no bem (8 dígitos)
  // Na UI: "Patrimônio / Plaqueta"
  patrimonio: {
    type: String,
    required: [true, 'Patrimônio é obrigatório'],
    unique: true,
    trim: true
  },
  // "Ativo nº" na planilha — código do sistema SAP/ERP da NAV Brasil (12 dígitos)
  // Diferente da Plaqueta: contém a plaqueta embutida com prefixo e sufixo numérico
  ativoSAP: {
    type: String,
    trim: true
  },
  numeroSerie: {
    type: String,
    trim: true
  },
  // "Plaqueta NAV" na planilha — número/código da etiqueta emitida pela NAV Brasil
  plaquetaNAV: {
    type: String,
    trim: true
  },

  // ── Classificação ─────────────────────────────────────────────────────────
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: [true, 'Categoria é obrigatória']
  },
  // "Categoria" na planilha — código contábil SAP (ex: 01.123101027.47)
  // Diferente do campo "categoria" acima, que é o tipo descritivo para uso operacional
  codigoContabil: {
    type: String,
    trim: true
  },

  // ── Localização ───────────────────────────────────────────────────────────
  setor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Setor',
  },
  localizacaoSetor: {
    type: String,
    trim: true
  },
  dnb: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DNB',
    required: [true, 'DNB é obrigatória']
  },

  // ── Detentor Patrimonial ───────────────────────────────────────────────────
  // "Detentor" na planilha — servidor que assinou o Termo de Responsabilidade Patrimonial
  // DIFERENTE de "usuarioResponsavel" (uso operacional)
  detentorNome: {
    type: String,
    trim: true
  },
  detentorMatricula: {
    type: String,
    trim: true
  },

  // ── Uso Operacional ────────────────────────────────────────────────────────
  // Quem usa o equipamento no dia a dia (diferente do Detentor Patrimonial)
  usuarioResponsavel: {
    type: String,
    trim: true
  },
  funcaoPerfil: {
    type: String,
    trim: true
  },

  // ── Situação Patrimonial ───────────────────────────────────────────────────
  // "Situação do Bem" na planilha — situação administrativa do bem
  situacaoBem: {
    type: String,
    enum: ['Uso próprio', 'Em andamento', 'Em depósito', 'Não Localizado'],
    default: 'Uso próprio',
  },
  // "Situação" na planilha — situação operacional do bem (Em uso, Inservível, etc.)
  // DIFERENTE do campo "situacao" abaixo, que é para uso interno de TI
  situacaoOperacional: {
    type: String,
    enum: ['Em uso', 'Inservível', 'Não Localizado', 'Outros'],
    default: 'Em uso',
  },
  // "Condições de Uso" na planilha — bem está em condições físicas de funcionar?
  condicoesUso: {
    type: Boolean,
  },
  // "Classificação" na planilha — para bens inservíveis, classifica o tipo de inservibilidade
  classificacaoInservivel: {
    type: String,
    enum: ['Ocioso', 'Recuperável', 'Antieconômico', 'Irrecuperável'],
  },
  // "Status" na planilha — se o bem foi fisicamente encontrado no inventário
  statusLocalizacao: {
    type: String,
    enum: ['Localizado', 'Não Localizado'],
    default: 'Localizado',
  },
  // "Descrição" na planilha — se a descrição do bem está completa ou incompleta
  descricaoCompleta: {
    type: Boolean,
    default: true,
  },

  // ── Situação Interna de TI ────────────────────────────────────────────────
  // Campo operacional interno (não equivale à "Situação" da planilha NAV)
  situacao: {
    type: String,
    required: [true, 'Situação é obrigatória'],
    enum: ['Ativo', 'Em uso', 'Em estoque', 'Com defeito', 'Em manutenção', 'Reserva', 'Descartado'],
    default: 'Em estoque'
  },

  // ── Rede / TI ─────────────────────────────────────────────────────────────
  hostname: {
    type: String,
    trim: true
  },
  enderecoIp: {
    type: String,
    trim: true
  },
  sistemaOperacional: {
    type: String,
    trim: true
  },
  ipGerencia: {
    type: String,
    trim: true
  },
  redeVlan: {
    type: String,
    enum: ['Rede Operacional', 'Rede Administrativa', 'Operacional', 'Administrativa', 'N/A'],
    default: 'N/A'
  },
  portasConexoes: {
    type: String,
    trim: true
  },

  // ── Outros ────────────────────────────────────────────────────────────────
  quantidade: {
    type: Number,
    required: [true, 'Quantidade é obrigatória'],
    default: 1,
    min: 1
  },
  observacoes: {
    type: String,
    trim: true
  },
  imagemUrl: {
    type: String,
    trim: true
  },
  vinculadoA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },

  // ── Auditoria ─────────────────────────────────────────────────────────────
  cadastradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  editadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

AssetSchema.index({ dnb: 1, createdAt: -1 });
AssetSchema.index({ dnb: 1, situacao: 1 });
AssetSchema.index({ situacao: 1 });
AssetSchema.index({ situacaoOperacional: 1 });
AssetSchema.index({ statusLocalizacao: 1 });
AssetSchema.index({ categoria: 1 });
AssetSchema.index({ hostname: 1 });
AssetSchema.index({ numeroSerie: 1 });
AssetSchema.index({ usuarioResponsavel: 1 });
AssetSchema.index({ detentorMatricula: 1 });
AssetSchema.index({ ativoSAP: 1 });

AssetSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export default mongoose.models.Asset || mongoose.model('Asset', AssetSchema);
