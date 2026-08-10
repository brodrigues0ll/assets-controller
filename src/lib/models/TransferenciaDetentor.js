import mongoose from 'mongoose';

const TransferenciaDetentorSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
  },
  detentorAnterior: {
    nome: { type: String, trim: true },
    matricula: { type: String, trim: true },
  },
  detentorNovo: {
    nome: { type: String, trim: true },
    matricula: { type: String, trim: true },
  },
  data: {
    type: Date,
    default: Date.now,
  },
  motivo: {
    type: String,
    trim: true,
  },
  registradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

TransferenciaDetentorSchema.index({ asset: 1, createdAt: -1 });

export default mongoose.models.TransferenciaDetentor || mongoose.model('TransferenciaDetentor', TransferenciaDetentorSchema);
