import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['tecnico', 'gestor', 'administrador'],
    default: 'tecnico'
  },
  dnbs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DNB'
  }],
  // Campo legado mantido para compatibilidade (será migrado para dnbs)
  dnb: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DNB'
  },
  active: {
    type: Boolean,
    default: true
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

// Migração automática: se dnb existe mas dnbs está vazio, migrar
UserSchema.pre('save', async function(next) {
  // Migrar dnb para dnbs se necessário
  if (this.dnb && (!this.dnbs || this.dnbs.length === 0)) {
    this.dnbs = [this.dnb];
  }

  // Só hashear se a senha foi modificada (ou é nova)
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// Método para verificar senha
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Atualizar updatedAt antes de cada update
UserSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
