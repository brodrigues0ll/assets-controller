import mongoose from 'mongoose';

const RegistroSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
  },
  statusEncontrado: {
    type: String,
    enum: ['Localizado', 'Não Localizado', 'Pendente'],
    default: 'Pendente',
  },
  condicoesUso: {
    type: Boolean,
    default: null,
  },
  localizacaoEncontrada: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Setor',
    default: null,
  },
  observacao: {
    type: String,
    trim: true,
  },
  conferidoEm: {
    type: Date,
    default: null,
  },
  conferidoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { _id: true });

const InventarioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
  },
  ano: {
    type: Number,
    required: [true, 'Ano é obrigatório'],
  },
  dnb: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DNB',
    required: [true, 'DNB é obrigatória'],
  },
  status: {
    type: String,
    enum: ['Em andamento', 'Concluído', 'Cancelado'],
    default: 'Em andamento',
  },
  dataInicio: {
    type: Date,
    default: Date.now,
  },
  dataFim: {
    type: Date,
    default: null,
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  registros: [RegistroSchema],
}, {
  timestamps: true,
});

InventarioSchema.index({ dnb: 1, ano: 1 });
InventarioSchema.index({ status: 1 });

export default mongoose.models.Inventario || mongoose.model('Inventario', InventarioSchema);
