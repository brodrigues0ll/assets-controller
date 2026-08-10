import mongoose from 'mongoose';

const PredioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
  },
  dnb: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DNB',
    required: [true, 'DNB é obrigatória'],
  },
  ativo: {
    type: Boolean,
    default: true,
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Nome único por DNB
PredioSchema.index({ dnb: 1, nome: 1 }, { unique: true });

export default mongoose.models.Predio || mongoose.model('Predio', PredioSchema);
