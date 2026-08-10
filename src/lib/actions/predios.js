'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Predio from '@/lib/models/Predio';
import AuditLog from '@/lib/models/AuditLog';
import { revalidatePath } from 'next/cache';

export async function getPredios() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  await connectDB();
  const predios = await Predio.find({ ativo: true })
    .populate('dnb', 'code name')
    .sort({ nome: 1 })
    .lean();
  return JSON.parse(JSON.stringify(predios));
}

export async function getAllPredios() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  await connectDB();
  const predios = await Predio.find()
    .populate('dnb', 'code name')
    .populate('criadoPor', 'name')
    .sort({ nome: 1 })
    .lean();
  return JSON.parse(JSON.stringify(predios));
}

export async function createPredio(data) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  if (!['gestor', 'administrador'].includes(session.user.role))
    throw new Error('Sem permissão para criar prédios');

  await connectDB();

  const existing = await Predio.findOne({ nome: data.nome, dnb: data.dnb });
  if (existing) throw new Error('Já existe um prédio com esse nome nesta DNB');

  const predio = await Predio.create({ ...data, criadoPor: session.user.id });

  await AuditLog.create({
    userId: session.user.id,
    action: 'create',
    entityType: 'predio',
    entityId: predio._id,
    description: `Criou prédio ${predio.nome}`,
  });

  revalidatePath('/dashboard/predios');
  return JSON.parse(JSON.stringify(predio));
}

export async function updatePredio(id, data) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  if (!['gestor', 'administrador'].includes(session.user.role))
    throw new Error('Sem permissão para editar prédios');

  await connectDB();

  const predio = await Predio.findByIdAndUpdate(id, data, { new: true });
  if (!predio) throw new Error('Prédio não encontrado');

  await AuditLog.create({
    userId: session.user.id,
    action: 'update',
    entityType: 'predio',
    entityId: predio._id,
    description: `Atualizou prédio ${predio.nome}`,
  });

  revalidatePath('/dashboard/predios');
  return JSON.parse(JSON.stringify(predio));
}

export async function deletePredio(id) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  if (session.user.role !== 'administrador')
    throw new Error('Apenas administradores podem excluir prédios');

  await connectDB();

  const predio = await Predio.findByIdAndDelete(id);
  if (!predio) throw new Error('Prédio não encontrado');

  await AuditLog.create({
    userId: session.user.id,
    action: 'delete',
    entityType: 'predio',
    entityId: id,
    description: `Excluiu prédio ${predio.nome}`,
  });

  revalidatePath('/dashboard/predios');
  return { success: true };
}
