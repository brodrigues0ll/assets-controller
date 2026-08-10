'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Fabricante from '@/lib/models/Fabricante';
import AuditLog from '@/lib/models/AuditLog';
import { revalidatePath } from 'next/cache';

export async function getFabricantes() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  await connectDB();

  const fabricantes = await Fabricante.find({ ativo: true })
    .sort({ nome: 1 })
    .lean();

  return JSON.parse(JSON.stringify(fabricantes));
}

export async function getAllFabricantes() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  await connectDB();

  const fabricantes = await Fabricante.find()
    .populate('criadoPor', 'name email')
    .sort({ nome: 1 })
    .lean();

  return JSON.parse(JSON.stringify(fabricantes));
}

export async function createFabricante(data) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (!['gestor', 'administrador'].includes(session.user.role)) {
    throw new Error('Sem permissão para criar fabricantes');
  }

  await connectDB();

  const existing = await Fabricante.findOne({ nome: data.nome });
  if (existing) throw new Error('Já existe um fabricante com esse nome');

  const fabricante = await Fabricante.create({
    ...data,
    criadoPor: session.user.id,
  });

  await AuditLog.create({
    userId: session.user.id,
    action: 'create',
    entityType: 'fabricante',
    entityId: fabricante._id,
    description: `Criou fabricante ${fabricante.nome}`,
  });

  revalidatePath('/dashboard/fabricantes');

  return JSON.parse(JSON.stringify(fabricante));
}

export async function updateFabricante(id, data) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (!['gestor', 'administrador'].includes(session.user.role)) {
    throw new Error('Sem permissão para editar fabricantes');
  }

  await connectDB();

  const fabricante = await Fabricante.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  );

  if (!fabricante) throw new Error('Fabricante não encontrado');

  await AuditLog.create({
    userId: session.user.id,
    action: 'update',
    entityType: 'fabricante',
    entityId: fabricante._id,
    description: `Atualizou fabricante ${fabricante.nome}`,
  });

  revalidatePath('/dashboard/fabricantes');

  return JSON.parse(JSON.stringify(fabricante));
}

export async function deleteFabricante(id) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (session.user.role !== 'administrador') {
    throw new Error('Apenas administradores podem excluir fabricantes');
  }

  await connectDB();

  const fabricante = await Fabricante.findByIdAndDelete(id);
  if (!fabricante) throw new Error('Fabricante não encontrado');

  await AuditLog.create({
    userId: session.user.id,
    action: 'delete',
    entityType: 'fabricante',
    entityId: id,
    description: `Excluiu fabricante ${fabricante.nome}`,
  });

  revalidatePath('/dashboard/fabricantes');

  return { success: true };
}
