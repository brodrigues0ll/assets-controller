import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const AssetSchema = new mongoose.Schema({
  assetId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  tipoEquipamento: {
    type: String,
    required: [true, 'Tipo de equipamento é obrigatório'],
    trim: true
  },
  subtipo: {
    type: String,
    required: [true, 'Subtipo/Modelo é obrigatório'],
    trim: true
  },
  fabricante: {
    type: String,
    required: [true, 'Fabricante é obrigatório'],
    trim: true
  },
  usuarioResponsavel: {
    type: String,
    trim: true
  },
  funcaoPerfil: {
    type: String,
    trim: true
  },
  localizacaoSetor: {
    type: String,
    required: [true, 'Localização/Setor é obrigatório'],
    trim: true
  },
  dnb: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DNB',
    required: [true, 'DNB é obrigatória']
  },
  patrimonio: {
    type: String,
    required: [true, 'Patrimônio é obrigatório'],
    unique: true,
    trim: true
  },
  numeroSerie: {
    type: String,
    trim: true
  },
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
    enum: ['Operacional', 'Administrativa', 'N/A'],
    default: 'N/A'
  },
  portasConexoes: {
    type: String,
    trim: true
  },
  quantidade: {
    type: Number,
    required: [true, 'Quantidade é obrigatória'],
    default: 1,
    min: 1
  },
  situacao: {
    type: String,
    required: [true, 'Situação é obrigatória'],
    enum: ['Ativo', 'Reserva', 'Em manutenção', 'Descartado'],
    default: 'Ativo'
  },
  observacoes: {
    type: String,
    trim: true
  },
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

// Índices para busca rápida
AssetSchema.index({ patrimonio: 1 });
AssetSchema.index({ dnb: 1 });
AssetSchema.index({ tipoEquipamento: 1 });
AssetSchema.index({ situacao: 1 });

// Atualizar updatedAt antes de cada update
AssetSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export default mongoose.models.Asset || mongoose.model('Asset', AssetSchema);
