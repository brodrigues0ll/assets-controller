import mongoose from 'mongoose';

const SetorSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
  },
  predio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Predio',
    required: [true, 'Prédio é obrigatório'],
  },
  descricao: {
    type: String,
    trim: true
  },
  codigoOficial: {
    type: String,
    trim: true,
  },
  ativo: {
    type: Boolean,
    default: true
  },
  criadoPor: {
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

// Nome único por prédio
SetorSchema.index({ predio: 1, nome: 1 }, { unique: true });

SetorSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export default mongoose.models.Setor || mongoose.model('Setor', SetorSchema);
