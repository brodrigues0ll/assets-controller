'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Asset from '@/lib/models/Asset';
import AuditLog from '@/lib/models/AuditLog';
import { canEditAsset, canViewAllDNBs, canCreateAssetInDNB } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function getAssets(filters = {}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  await connectDB();

  let query = {};

  // Técnico só vê ativos de suas DNBs
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
      query.dnb = { $in: dnbIds };
    } else {
      // Se técnico não tem DNBs, não retornar nada
      query.dnb = null;
    }
  }

  // Aplicar filtros adicionais
  if (filters.dnb) query.dnb = filters.dnb;
  if (filters.tipoEquipamento) query.tipoEquipamento = filters.tipoEquipamento;
  if (filters.situacao) query.situacao = filters.situacao;

  const assets = await Asset.find(query)
    .populate('dnb')
    .populate('cadastradoPor', 'name email')
    .populate('editadoPor', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(assets));
}

export async function getAssetById(id) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  await connectDB();

  const asset = await Asset.findById(id)
    .populate('dnb')
    .populate('cadastradoPor', 'name email')
    .populate('editadoPor', 'name email')
    .lean();

  if (!asset) {
    throw new Error('Ativo não encontrado');
  }

  // Verificar permissão de visualização
  if (session.user.role === 'tecnico') {
    // Suporta múltiplas DNBs (novo) e DNB única (legado)
    const userDnbs = session.user.dnbs || (session.user.dnb ? [session.user.dnb] : []);

    if (userDnbs.length > 0) {
      const assetDnbId = asset.dnb._id.toString();
      const hasAccess = userDnbs.some(dnb => {
        const dnbId = typeof dnb === 'object' ? dnb.id || dnb._id : dnb;
        return dnbId.toString() === assetDnbId;
      });

      if (!hasAccess) {
        throw new Error('Sem permissão para visualizar este ativo');
      }
    } else {
      throw new Error('Sem permissão para visualizar este ativo');
    }
  }

  return JSON.parse(JSON.stringify(asset));
}

export async function createAsset(data) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  await connectDB();

  // Verificar se o usuário pode criar ativos na DNB especificada
  if (!canCreateAssetInDNB(session.user, data.dnb)) {
    throw new Error('Você não tem permissão para criar ativos nesta DNB. Técnicos só podem criar ativos na DNB à qual estão vinculados.');
  }

  // Verificar se patrimônio já existe
  const existingAsset = await Asset.findOne({ patrimonio: data.patrimonio });
  if (existingAsset) {
    throw new Error('Patrimônio já cadastrado');
  }

  const asset = await Asset.create({
    ...data,
    cadastradoPor: session.user.id,
  });

  // Criar log de auditoria
  await AuditLog.create({
    userId: session.user.id,
    action: 'create',
    entityType: 'asset',
    entityId: asset._id,
    dnb: asset.dnb,
    description: `Criou ativo ${asset.patrimonio}`,
  });

  revalidatePath('/dashboard/assets');

  return JSON.parse(JSON.stringify(asset));
}

export async function updateAsset(id, data) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  await connectDB();

  const asset = await Asset.findById(id);

  if (!asset) {
    throw new Error('Ativo não encontrado');
  }

  // Verificar permissão de edição
  if (!canEditAsset(session.user, asset)) {
    throw new Error('Sem permissão para editar este ativo');
  }

  // Se a DNB está sendo alterada, verificar se o técnico tem permissão na nova DNB
  if (data.dnb && data.dnb.toString() !== asset.dnb.toString()) {
    if (!canCreateAssetInDNB(session.user, data.dnb)) {
      throw new Error('Você não tem permissão para mover este ativo para a DNB especificada. Técnicos só podem gerenciar ativos na DNB à qual estão vinculados.');
    }
  }

  const oldData = asset.toObject();

  Object.assign(asset, data);
  asset.editadoPor = session.user.id;
  await asset.save();

  // Criar log de auditoria
  await AuditLog.create({
    userId: session.user.id,
    action: 'update',
    entityType: 'asset',
    entityId: asset._id,
    dnb: asset.dnb,
    changes: {
      old: oldData,
      new: asset.toObject(),
    },
    description: `Atualizou ativo ${asset.patrimonio}`,
  });

  revalidatePath('/dashboard/assets');

  return JSON.parse(JSON.stringify(asset));
}

export async function deleteAsset(id) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  await connectDB();

  const asset = await Asset.findById(id);

  if (!asset) {
    throw new Error('Ativo não encontrado');
  }

  // Verificar permissão de edição (mesma lógica para exclusão)
  if (!canEditAsset(session.user, asset)) {
    throw new Error('Sem permissão para excluir este ativo');
  }

  await Asset.findByIdAndDelete(id);

  // Criar log de auditoria
  await AuditLog.create({
    userId: session.user.id,
    action: 'delete',
    entityType: 'asset',
    entityId: id,
    dnb: asset.dnb,
    description: `Excluiu ativo ${asset.patrimonio}`,
  });

  revalidatePath('/dashboard/assets');

  return { success: true };
}
