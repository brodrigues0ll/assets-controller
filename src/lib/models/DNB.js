import mongoose from 'mongoose';

const DNBSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome da DNB é obrigatório'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Código da DNB é obrigatório'],
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  setores: [{
    type: String,
    trim: true
  }],
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
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

// Atualizar updatedAt antes de cada update
DNBSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export default mongoose.models.DNB || mongoose.model('DNB', DNBSchema);
