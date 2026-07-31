'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GrupoPermissao from '@/lib/models/GrupoPermissao';
import AuditLog from '@/lib/models/AuditLog';
import { revalidatePath } from 'next/cache';

export async function getGrupos() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (session.user.role !== 'administrador') {
    throw new Error('Apenas administradores podem visualizar grupos');
  }

  await connectDB();

  const grupos = await GrupoPermissao.find()
    .populate('criadoPor', 'name email')
    .populate('dnbs', 'code name')
    .sort({ nome: 1 })
    .lean();

  return JSON.parse(JSON.stringify(grupos));
}

export async function getGrupoById(id) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (session.user.role !== 'administrador') {
    throw new Error('Apenas administradores podem visualizar grupos');
  }

  await connectDB();

  const grupo = await GrupoPermissao.findById(id)
    .populate('criadoPor', 'name email')
    .populate('dnbs', 'code name')
    .lean();

  if (!grupo) throw new Error('Grupo não encontrado');

  return JSON.parse(JSON.stringify(grupo));
}

export async function createGrupo(data) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (session.user.role !== 'administrador') {
    throw new Error('Apenas administradores podem criar grupos');
  }

  await connectDB();

  const existing = await GrupoPermissao.findOne({ nome: data.nome });
  if (existing) throw new Error('Já existe um grupo com esse nome');

  const grupo = await GrupoPermissao.create({
    ...data,
    criadoPor: session.user.id,
  });

  await AuditLog.create({
    userId: session.user.id,
    action: 'create',
    entityType: 'grupo',
    entityId: grupo._id,
    description: `Criou grupo de permissão ${grupo.nome}`,
  });

  revalidatePath('/dashboard/grupos');

  return JSON.parse(JSON.stringify(grupo));
}

export async function updateGrupo(id, data) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (session.user.role !== 'administrador') {
    throw new Error('Apenas administradores podem editar grupos');
  }

  await connectDB();

  const grupo = await GrupoPermissao.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  );

  if (!grupo) throw new Error('Grupo não encontrado');

  await AuditLog.create({
    userId: session.user.id,
    action: 'update',
    entityType: 'grupo',
    entityId: grupo._id,
    description: `Atualizou grupo de permissão ${grupo.nome}`,
  });

  revalidatePath('/dashboard/grupos');

  return JSON.parse(JSON.stringify(grupo));
}

export async function deleteGrupo(id) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (session.user.role !== 'administrador') {
    throw new Error('Apenas administradores podem excluir grupos');
  }

  await connectDB();

  const grupo = await GrupoPermissao.findByIdAndDelete(id);
  if (!grupo) throw new Error('Grupo não encontrado');

  await AuditLog.create({
    userId: session.user.id,
    action: 'delete',
    entityType: 'grupo',
    entityId: id,
    description: `Excluiu grupo de permissão ${grupo.nome}`,
  });

  revalidatePath('/dashboard/grupos');

  return { success: true };
}
