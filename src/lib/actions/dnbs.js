'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DNB from '@/lib/models/DNB';
import AuditLog from '@/lib/models/AuditLog';
import { canManageDNBs } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function getDNBs() {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  await connectDB();

  // Se o usuário for técnico, retornar apenas as DNBs dele
  let query = { active: true };
  if (session.user.role === 'tecnico') {
    // Suporta múltiplas DNBs (novo) e DNB única (legado)
    const userDnbs = session.user.dnbs || (session.user.dnb ? [session.user.dnb] : []);

    if (userDnbs.length > 0) {
      // Extrai os IDs das DNBs
      const dnbIds = userDnbs.map(dnb => {
        if (typeof dnb === 'object') {
          return dnb.id || dnb._id;
        }
        return dnb;
      });
      query._id = { $in: dnbIds };
    } else {
      // Se técnico não tem DNBs, retornar array vazio
      return [];
    }
  }

  const dnbs = await DNB.find(query)
    .sort({ name: 1 })
    .lean();

  return JSON.parse(JSON.stringify(dnbs));
}

// Retorna DNBs filtradas baseado no role do usuário
// Técnicos veem apenas sua DNB, Gestores/Admins veem todas
export async function getAllDNBs() {
  return getDNBs();
}

// Retorna todas as DNBs sem filtro (apenas para gestores/administradores)
export async function getAllDNBsUnfiltered() {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  // Apenas gestores e administradores podem ver todas as DNBs
  if (session.user.role === 'tecnico') {
    throw new Error('Sem permissão para visualizar todas as DNBs');
  }

  await connectDB();

  const dnbs = await DNB.find({ active: true })
    .sort({ name: 1 })
    .lean();

  return JSON.parse(JSON.stringify(dnbs));
}

export async function getDNBById(id) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  await connectDB();

  const dnb = await DNB.findById(id).lean();

  if (!dnb) {
    throw new Error('DNB não encontrada');
  }

  return JSON.parse(JSON.stringify(dnb));
}

export async function createDNB(data) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  if (!canManageDNBs(session.user.role)) {
    throw new Error('Sem permissão para criar DNBs');
  }

  await connectDB();

  // Verificar se código já existe
  const existingDNB = await DNB.findOne({ code: data.code.toUpperCase() });
  if (existingDNB) {
    throw new Error('Código de DNB já cadastrado');
  }

  const dnb = await DNB.create({
    ...data,
    code: data.code.toUpperCase(),
    createdBy: session.user.id,
  });

  // Criar log de auditoria
  await AuditLog.create({
    userId: session.user.id,
    action: 'create',
    entityType: 'dnb',
    entityId: dnb._id,
    description: `Criou DNB ${dnb.name} (${dnb.code})`,
  });

  revalidatePath('/dashboard/dnbs');

  return JSON.parse(JSON.stringify(dnb));
}

export async function updateDNB(id, data) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  if (!canManageDNBs(session.user.role)) {
    throw new Error('Sem permissão para editar DNBs');
  }

  await connectDB();

  const dnb = await DNB.findById(id);

  if (!dnb) {
    throw new Error('DNB não encontrada');
  }

  const oldData = dnb.toObject();

  Object.assign(dnb, {
    ...data,
    code: data.code.toUpperCase(),
  });

  await dnb.save();

  // Criar log de auditoria
  await AuditLog.create({
    userId: session.user.id,
    action: 'update',
    entityType: 'dnb',
    entityId: dnb._id,
    changes: {
      old: oldData,
      new: dnb.toObject(),
    },
    description: `Atualizou DNB ${dnb.name} (${dnb.code})`,
  });

  revalidatePath('/dashboard/dnbs');

  return JSON.parse(JSON.stringify(dnb));
}

export async function deleteDNB(id) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  if (!canManageDNBs(session.user.role)) {
    throw new Error('Sem permissão para excluir DNBs');
  }

  await connectDB();

  const dnb = await DNB.findById(id);

  if (!dnb) {
    throw new Error('DNB não encontrada');
  }

  // Soft delete
  dnb.active = false;
  await dnb.save();

  // Criar log de auditoria
  await AuditLog.create({
    userId: session.user.id,
    action: 'delete',
    entityType: 'dnb',
    entityId: id,
    description: `Desativou DNB ${dnb.name} (${dnb.code})`,
  });

  revalidatePath('/dashboard/dnbs');

  return { success: true };
}
