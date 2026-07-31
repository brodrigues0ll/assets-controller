import mongoose from 'mongoose';

const CategoriaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    unique: true
  },
  descricao: {
    type: String,
    trim: true
  },
  icone: {
    type: String,
    default: 'package'
  },
  temRede: {
    type: Boolean,
    default: false
  },
  temSO: {
    type: Boolean,
    default: false
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

CategoriaSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export default mongoose.models.Categoria || mongoose.model('Categoria', CategoriaSchema);
