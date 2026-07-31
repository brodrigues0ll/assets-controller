'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Categoria from '@/lib/models/Categoria';
import AuditLog from '@/lib/models/AuditLog';
import { revalidatePath } from 'next/cache';

export async function getCategorias() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  await connectDB();

  const categorias = await Categoria.find({ ativo: true })
    .sort({ nome: 1 })
    .lean();

  return JSON.parse(JSON.stringify(categorias));
}

export async function getAllCategorias() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  await connectDB();

  const categorias = await Categoria.find()
    .populate('criadoPor', 'name email')
    .sort({ nome: 1 })
    .lean();

  return JSON.parse(JSON.stringify(categorias));
}

export async function getCategoriaById(id) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  await connectDB();

  const categoria = await Categoria.findById(id).lean();
  if (!categoria) throw new Error('Categoria não encontrada');

  return JSON.parse(JSON.stringify(categoria));
}

export async function createCategoria(data) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (!['gestor', 'administrador'].includes(session.user.role)) {
    throw new Error('Sem permissão para criar categorias');
  }

  await connectDB();

  const existing = await Categoria.findOne({ nome: data.nome });
  if (existing) throw new Error('Já existe uma categoria com esse nome');

  const categoria = await Categoria.create({
    ...data,
    criadoPor: session.user.id,
  });

  await AuditLog.create({
    userId: session.user.id,
    action: 'create',
    entityType: 'categoria',
    entityId: categoria._id,
    description: `Criou categoria ${categoria.nome}`,
  });

  revalidatePath('/dashboard/categorias');

  return JSON.parse(JSON.stringify(categoria));
}

export async function updateCategoria(id, data) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (!['gestor', 'administrador'].includes(session.user.role)) {
    throw new Error('Sem permissão para editar categorias');
  }

  await connectDB();

  const categoria = await Categoria.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  );

  if (!categoria) throw new Error('Categoria não encontrada');

  await AuditLog.create({
    userId: session.user.id,
    action: 'update',
    entityType: 'categoria',
    entityId: categoria._id,
    description: `Atualizou categoria ${categoria.nome}`,
  });

  revalidatePath('/dashboard/categorias');

  return JSON.parse(JSON.stringify(categoria));
}

export async function deleteCategoria(id) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');

  if (session.user.role !== 'administrador') {
    throw new Error('Apenas administradores podem excluir categorias');
  }

  await connectDB();

  const categoria = await Categoria.findByIdAndDelete(id);
  if (!categoria) throw new Error('Categoria não encontrada');

  await AuditLog.create({
    userId: session.user.id,
    action: 'delete',
    entityType: 'categoria',
    entityId: id,
    description: `Excluiu categoria ${categoria.nome}`,
  });

  revalidatePath('/dashboard/categorias');

  return { success: true };
}
