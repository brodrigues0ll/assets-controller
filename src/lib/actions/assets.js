'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Asset from '@/lib/models/Asset';
import AuditLog from '@/lib/models/AuditLog';
import { canEditAsset, canCreateAssetInDNB } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function searchAssetsByPatrimonio(query) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  if (!query || query.length < 2) return [];

  await connectDB();

  const re = { $regex: query, $options: 'i' };
  const assets = await Asset.find({ $or: [{ patrimonio: re }, { ativoSAP: re }] })
    .select('_id patrimonio ativoSAP tipoEquipamento subtipo categoria')
    .populate('categoria', 'nome')
    .limit(10)
    .lean();

  return JSON.parse(JSON.stringify(assets));
}

export async function getAssetCounts() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  await connectDB();

  const base = session.user.role === 'tecnico'
    ? { dnb: { $in: (session.user.dnbs || (session.user.dnb ? [session.user.dnb] : [])).map(d => typeof d === 'object' ? d.id || d._id : d) } }
    : {};

  const [naoLocalizados, inservíveis, descricaoIncompleta] = await Promise.all([
    Asset.countDocuments({ ...base, statusLocalizacao: 'Não Localizado' }),
    Asset.countDocuments({ ...base, situacaoOperacional: 'Inservível' }),
    Asset.countDocuments({ ...base, descricaoCompleta: false }),
  ]);

  return JSON.parse(JSON.stringify({ naoLocalizados, inservíveis, descricaoIncompleta }));
}

export async function getAssets({ page = 1, limit = 25, search = '', dnb: dnbFilter = '', situacao: situacaoFilter = '', situacaoOperacional: situacaoOpFilter = '', statusLocalizacao: statusLocFilter = '', descricaoCompleta: descricaoFilter = '', categoria: categoriaFilter = '' } = {}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  await connectDB();

  let query = {};

  // Técnico só vê ativos de suas DNBs
  if (session.user.role === 'tecnico') {
    const userDnbs = session.user.dnbs || (session.user.dnb ? [session.user.dnb] : []);
    if (userDnbs.length > 0) {
      const dnbIds = userDnbs.map(dnb => (typeof dnb === 'object' ? dnb.id || dnb._id : dnb));
      query.dnb = { $in: dnbIds };
    } else {
      query.dnb = null;
    }
  }

  // Filtros server-side
  if (dnbFilter) query.dnb = dnbFilter;
  if (situacaoFilter) query.situacao = situacaoFilter;
  if (situacaoOpFilter) query.situacaoOperacional = situacaoOpFilter;
  if (statusLocFilter) query.statusLocalizacao = statusLocFilter;
  if (descricaoFilter === 'false') query.descricaoCompleta = false;
  if (categoriaFilter) query.categoria = categoriaFilter;

  // Busca por texto (regex nos campos indexados)
  if (search && search.length >= 2) {
    const re = { $regex: search, $options: 'i' };
    query.$or = [
      { patrimonio: re },
      { ativoSAP: re },
      { tipoEquipamento: re },
      { hostname: re },
      { usuarioResponsavel: re },
      { detentorNome: re },
      { numeroSerie: re },
    ];
  }

  const total = await Asset.countDocuments(query);
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  const skip = limit > 0 ? (page - 1) * limit : 0;

  const assets = await Asset.find(query)
    .populate('dnb')
    .populate('categoria', 'nome')
    .populate('cadastradoPor', 'name email')
    .populate('editadoPor', 'name email')
    .populate({ path: 'setor', select: 'nome predio', populate: { path: 'predio', select: 'nome' } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit > 0 ? limit : 0)
    .lean();

  return JSON.parse(JSON.stringify({ assets, total, totalPages, page }));
}

export async function getAssetById(id) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Não autenticado');
  }

  await connectDB();

  const asset = await Asset.findById(id)
    .populate('dnb')
    .populate('categoria', 'nome')
    .populate('cadastradoPor', 'name email')
    .populate('editadoPor', 'name email')
    .populate({ path: 'setor', select: 'nome predio', populate: { path: 'predio', select: 'nome' } })
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

  // Resolver patrimônio → ObjectId para vinculadoA
  const payload = { ...data };
  if (payload.vinculadoA && !/^[0-9a-fA-F]{24}$/.test(payload.vinculadoA)) {
    const pai = await Asset.findOne({ patrimonio: payload.vinculadoA });
    if (!pai) throw new Error(`Ativo pai com patrimônio "${payload.vinculadoA}" não encontrado`);
    payload.vinculadoA = pai._id;
  }

  const asset = await Asset.create({
    ...payload,
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

  // Resolver patrimônio → ObjectId para vinculadoA
  const payload = { ...data };
  if (payload.vinculadoA && !/^[0-9a-fA-F]{24}$/.test(payload.vinculadoA)) {
    const pai = await Asset.findOne({ patrimonio: payload.vinculadoA });
    if (!pai) throw new Error(`Ativo pai com patrimônio "${payload.vinculadoA}" não encontrado`);
    payload.vinculadoA = pai._id;
  }

  Object.assign(asset, payload);
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
