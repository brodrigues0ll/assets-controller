'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Setor from '@/lib/models/Setor';
import AuditLog from '@/lib/models/AuditLog';
import { revalidatePath } from 'next/cache';

export async function getSetores() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  await connectDB();

  const setores = await Setor.find({ ativo: true })
    .populate({ path: 'predio', select: 'nome dnb', populate: { path: 'dnb', select: 'code name' } })
    .sort({ nome: 1 })
    .lean();

  return JSON.parse(JSON.stringify(setores));
}

export async function getAllSetores() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  await connectDB();

  const setores = await Setor.find()
    .populate({ path: 'predio', select: 'nome dnb', populate: { path: 'dnb', select: 'code name' } })
    .populate('criadoPor', 'name email')
    .sort({ nome: 1 })
    .lean();

  return JSON.parse(JSON.stringify(setores));
}

export async function createSetor(data) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (!['gestor', 'administrador'].includes(session.user.role)) {
    throw new Error('Sem permissão para criar setores');
  }

  await connectDB();

  const existing = await Setor.findOne({ nome: data.nome, predio: data.predio });
  if (existing) throw new Error('Já existe um setor com esse nome neste prédio');

  const setor = await Setor.create({
    ...data,
    criadoPor: session.user.id,
  });

  await AuditLog.create({
    userId: session.user.id,
    action: 'create',
    entityType: 'setor',
    entityId: setor._id,
    description: `Criou setor ${setor.nome}`,
  });

  revalidatePath('/dashboard/setores');

  return JSON.parse(JSON.stringify(setor));
}

export async function updateSetor(id, data) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (!['gestor', 'administrador'].includes(session.user.role)) {
    throw new Error('Sem permissão para editar setores');
  }

  await connectDB();

  const setor = await Setor.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  );

  if (!setor) throw new Error('Setor não encontrado');

  await AuditLog.create({
    userId: session.user.id,
    action: 'update',
    entityType: 'setor',
    entityId: setor._id,
    description: `Atualizou setor ${setor.nome}`,
  });

  revalidatePath('/dashboard/setores');

  return JSON.parse(JSON.stringify(setor));
}

export async function deleteSetor(id) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (session.user.role !== 'administrador') {
    throw new Error('Apenas administradores podem excluir setores');
  }

  await connectDB();

  const setor = await Setor.findByIdAndDelete(id);
  if (!setor) throw new Error('Setor não encontrado');

  await AuditLog.create({
    userId: session.user.id,
    action: 'delete',
    entityType: 'setor',
    entityId: id,
    description: `Excluiu setor ${setor.nome}`,
  });

  revalidatePath('/dashboard/setores');

  return { success: true };
}
