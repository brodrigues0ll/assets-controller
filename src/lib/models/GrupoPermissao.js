import mongoose from 'mongoose';

const GrupoPermissaoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    unique: true,
    trim: true
  },
  descricao: {
    type: String,
    trim: true
  },
  permissoes: {
    ativos: {
      criar: { type: Boolean, default: false },
      editar: { type: Boolean, default: false },
      excluir: { type: Boolean, default: false },
      ver: { type: Boolean, default: true },
    },
    usuarios: {
      criar: { type: Boolean, default: false },
      editar: { type: Boolean, default: false },
      excluir: { type: Boolean, default: false },
      ver: { type: Boolean, default: false },
    },
    categorias: {
      criar: { type: Boolean, default: false },
      editar: { type: Boolean, default: false },
      excluir: { type: Boolean, default: false },
      ver: { type: Boolean, default: true },
    },
    relatorios: {
      ver: { type: Boolean, default: false },
      exportar: { type: Boolean, default: false },
    },
    audit: {
      ver: { type: Boolean, default: false },
    }
  },
  dnbs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DNB' }],
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

GrupoPermissaoSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export default mongoose.models.GrupoPermissao || mongoose.model('GrupoPermissao', GrupoPermissaoSchema);
