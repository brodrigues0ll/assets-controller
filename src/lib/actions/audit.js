'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import AuditLog from '@/lib/models/AuditLog';

export async function getAuditLogs(filters = {}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  // Apenas gestores e administradores podem ver logs
  if (session.user.role === 'tecnico') {
    throw new Error('Sem permissão para visualizar logs');
  }

  await connectDB();

  let query = {};

  // Aplicar filtros
  if (filters.action) query.action = filters.action;
  if (filters.entityType) query.entityType = filters.entityType;
  if (filters.userId) query.userId = filters.userId;
  if (filters.dnb) query.dnb = filters.dnb;

  const logs = await AuditLog.find(query)
    .populate('userId', 'name email')
    .populate('dnb', 'code name')
    .sort({ timestamp: -1 })
    .limit(1000) // Limitar a 1000 registros mais recentes
    .lean();

  // Renomear userId para user para facilitar uso no frontend
  const logsFormatted = logs.map(log => ({
    ...log,
    user: log.userId,
    userId: undefined
  }));

  return JSON.parse(JSON.stringify(logsFormatted));
}

export async function exportAuditLogs(logs) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  if (session.user.role === 'tecnico') {
    throw new Error('Sem permissão para exportar logs');
  }

  // Definir cabeçalhos
  const headers = [
    'Data/Hora',
    'Usuário',
    'Email',
    'Ação',
    'Tipo de Entidade',
    'Descrição',
    'DNB',
  ];

  // Converter logs para linhas CSV
  const rows = logs.map((log) => {
    return [
      log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : '',
      log.user?.name || '',
      log.user?.email || '',
      log.action || '',
      log.entityType || '',
      (log.description || '').replace(/"/g, '""'), // Escapar aspas duplas
      log.dnb?.code || '',
    ];
  });

  // Criar CSV
  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

export async function getAuditLogsByEntity(entityType, entityId) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  if (session.user.role === 'tecnico') {
    throw new Error('Sem permissão para visualizar logs');
  }

  await connectDB();

  const logs = await AuditLog.find({
    entityType,
    entityId,
  })
    .populate('userId', 'name email')
    .populate('dnb', 'code name')
    .sort({ timestamp: -1 })
    .lean();

  const logsFormatted = logs.map(log => ({
    ...log,
    user: log.userId,
    userId: undefined
  }));

  return JSON.parse(JSON.stringify(logsFormatted));
}
