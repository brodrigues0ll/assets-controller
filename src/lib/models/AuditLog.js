import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'movimentacao']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['asset', 'user', 'dnb']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  dnb: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DNB'
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  description: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Índices para consultas rápidas
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ dnb: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
