'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import AuditLog from '@/lib/models/AuditLog';
import { canManageUsers, canDeleteUser } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function getUsers(filters = {}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  if (!canManageUsers(session.user.role)) {
    throw new Error('Sem permissão para visualizar usuários');
  }

  await connectDB();

  let query = { active: true };

  if (filters.role) query.role = filters.role;
  if (filters.dnb) query.dnb = filters.dnb;

  const users = await User.find(query)
    .populate('dnb')
    .populate('dnbs')
    .sort({ name: 1 })
    .lean();

  return JSON.parse(JSON.stringify(users));
}

export async function getUserById(id) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  await connectDB();

  const user = await User.findById(id)
    .populate('dnb')
    .populate('dnbs')
    .lean();

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  return JSON.parse(JSON.stringify(user));
}

export async function createUser(data) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  if (!canManageUsers(session.user.role)) {
    throw new Error('Sem permissão para criar usuários');
  }

  await connectDB();

  // Verificar se email já existe
  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    throw new Error('Email já cadastrado');
  }

  const user = await User.create({
    ...data,
    email: data.email.toLowerCase(),
  });

  // Criar log de auditoria
  await AuditLog.create({
    userId: session.user.id,
    action: 'create',
    entityType: 'user',
    entityId: user._id,
    description: `Criou usuário ${user.name} (${user.email})`,
  });

  revalidatePath('/dashboard/users');

  return JSON.parse(JSON.stringify(user));
}

export async function updateUser(id, data) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  if (!canManageUsers(session.user.role)) {
    throw new Error('Sem permissão para editar usuários');
  }

  await connectDB();

  const user = await User.findById(id);

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const oldData = { ...user.toObject() };
  delete oldData.password; // Não logar senha

  // Atualizar campos (exceto senha se não foi fornecida)
  const updateData = { ...data };
  if (!updateData.password) {
    delete updateData.password;
  }

  Object.assign(user, updateData);
  await user.save();

  // Criar log de auditoria
  const newData = { ...user.toObject() };
  delete newData.password;

  await AuditLog.create({
    userId: session.user.id,
    action: 'update',
    entityType: 'user',
    entityId: user._id,
    changes: {
      old: oldData,
      new: newData,
    },
    description: `Atualizou usuário ${user.name} (${user.email})`,
  });

  revalidatePath('/dashboard/users');

  return JSON.parse(JSON.stringify(user));
}

export async function resetUserPassword(id, newPassword) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  if (!canManageUsers(session.user.role)) {
    throw new Error('Sem permissão para resetar senhas');
  }

  await connectDB();

  const user = await User.findById(id);

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  user.password = newPassword;
  await user.save();

  // Criar log de auditoria
  await AuditLog.create({
    userId: session.user.id,
    action: 'update',
    entityType: 'user',
    entityId: user._id,
    description: `Resetou senha do usuário ${user.name} (${user.email})`,
  });

  revalidatePath('/dashboard/users');

  return { success: true };
}

export async function deleteUser(id) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  if (!canManageUsers(session.user.role)) {
    throw new Error('Sem permissão para excluir usuários');
  }

  await connectDB();

  const user = await User.findById(id);

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Não permitir excluir a si mesmo
  if (user._id.toString() === session.user.id) {
    throw new Error('Não é possível excluir seu próprio usuário');
  }

  // Verificar hierarquia: validar se o usuário tem permissão para remover o usuário alvo
  if (!canDeleteUser(session.user.role, user.role)) {
    const roleNames = {
      tecnico: 'técnico',
      gestor: 'gestor',
      administrador: 'administrador'
    };
    throw new Error(
      `Você não tem permissão para remover um ${roleNames[user.role]}. ` +
      `Apenas ${session.user.role === 'gestor' ? 'administradores podem remover administradores' : 'gestores e administradores podem remover outros usuários'}.`
    );
  }

  // Soft delete
  user.active = false;
  await user.save();

  // Criar log de auditoria
  await AuditLog.create({
    userId: session.user.id,
    action: 'delete',
    entityType: 'user',
    entityId: id,
    description: `Desativou usuário ${user.name} (${user.email})`,
  });

  revalidatePath('/dashboard/users');

  return { success: true };
}
