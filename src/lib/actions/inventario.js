'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Inventario from '@/lib/models/Inventario';
import Asset from '@/lib/models/Asset';
import { revalidatePath } from 'next/cache';

export async function getInventarios() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  await connectDB();

  const query = session.user.role === 'tecnico'
    ? { dnb: { $in: (session.user.dnbs || (session.user.dnb ? [session.user.dnb] : [])).map(d => typeof d === 'object' ? d.id || d._id : d) } }
    : {};

  const inventarios = await Inventario.find(query)
    .populate('dnb', 'code name')
    .populate('criadoPor', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(inventarios));
}

export async function getInventarioById(id) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  await connectDB();

  const inv = await Inventario.findById(id)
    .populate('dnb', 'code name')
    .populate('criadoPor', 'name')
    .populate({
      path: 'registros.asset',
      select: 'patrimonio ativoSAP tipoEquipamento subtipo fabricante detentorNome detentorMatricula situacaoOperacional statusLocalizacao',
      populate: { path: 'setor', select: 'nome predio', populate: { path: 'predio', select: 'nome' } },
    })
    .populate('registros.conferidoPor', 'name')
    .populate('registros.localizacaoEncontrada', 'nome')
    .lean();

  if (!inv) throw new Error('Inventário não encontrado');
  return JSON.parse(JSON.stringify(inv));
}

export async function createInventario({ nome, ano, dnbId }) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  if (!['gestor', 'administrador'].includes(session.user.role)) {
    throw new Error('Sem permissão para criar inventário');
  }
  await connectDB();

  // Busca todos os ativos da DNB para pré-popular os registros
  const assets = await Asset.find({ dnb: dnbId }).select('_id').lean();

  const registros = assets.map(a => ({
    asset: a._id,
    statusEncontrado: 'Pendente',
  }));

  const inv = await Inventario.create({
    nome,
    ano: Number(ano),
    dnb: dnbId,
    criadoPor: session.user.id,
    registros,
  });

  revalidatePath('/dashboard/inventario');
  return JSON.parse(JSON.stringify(inv));
}

export async function updateRegistro(inventarioId, assetId, { statusEncontrado, condicoesUso, observacao, localizacaoEncontradaId }) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  await connectDB();

  const inv = await Inventario.findById(inventarioId);
  if (!inv) throw new Error('Inventário não encontrado');
  if (inv.status === 'Concluído') throw new Error('Inventário já concluído');

  const reg = inv.registros.find(r => r.asset.toString() === assetId);
  if (!reg) throw new Error('Registro não encontrado');

  reg.statusEncontrado = statusEncontrado;
  if (condicoesUso !== undefined) reg.condicoesUso = condicoesUso;
  if (observacao !== undefined) reg.observacao = observacao;
  if (localizacaoEncontradaId) reg.localizacaoEncontrada = localizacaoEncontradaId;
  reg.conferidoEm = new Date();
  reg.conferidoPor = session.user.id;

  // Propagação automática: se marcado como Não Localizado, atualiza o ativo
  if (statusEncontrado === 'Não Localizado') {
    await Asset.findByIdAndUpdate(assetId, {
      statusLocalizacao: 'Não Localizado',
      editadoPor: session.user.id,
    });
  } else if (statusEncontrado === 'Localizado') {
    await Asset.findByIdAndUpdate(assetId, {
      statusLocalizacao: 'Localizado',
      ...(condicoesUso !== undefined && { condicoesUso }),
      ...(localizacaoEncontradaId && { setor: localizacaoEncontradaId }),
      editadoPor: session.user.id,
    });
  }

  await inv.save();
  revalidatePath(`/dashboard/inventario/${inventarioId}`);
  return { ok: true };
}

export async function finalizarInventario(inventarioId) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  if (!['gestor', 'administrador'].includes(session.user.role)) {
    throw new Error('Sem permissão para finalizar inventário');
  }
  await connectDB();

  const inv = await Inventario.findById(inventarioId);
  if (!inv) throw new Error('Inventário não encontrado');

  const pendentes = inv.registros.filter(r => r.statusEncontrado === 'Pendente').length;
  if (pendentes > 0) {
    throw new Error(`Ainda há ${pendentes} bem(ns) pendente(s). Confira todos antes de finalizar.`);
  }

  inv.status = 'Concluído';
  inv.dataFim = new Date();
  await inv.save();

  revalidatePath('/dashboard/inventario');
  return JSON.parse(JSON.stringify(inv));
}

export async function cancelarInventario(inventarioId) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  if (!['gestor', 'administrador'].includes(session.user.role)) {
    throw new Error('Sem permissão para cancelar inventário');
  }
  await connectDB();

  await Inventario.findByIdAndUpdate(inventarioId, { status: 'Cancelado' });
  revalidatePath('/dashboard/inventario');
  return { ok: true };
}

export async function getAlertasPatrimoniais() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autenticado');
  await connectDB();

  const base = session.user.role === 'tecnico'
    ? { dnb: { $in: (session.user.dnbs || (session.user.dnb ? [session.user.dnb] : [])).map(d => typeof d === 'object' ? d.id || d._id : d) } }
    : {};

  const hoje = new Date();

  // Bens com vida útil vencida (mesesEmServico >= vidaUtilMeses)
  const todosComVida = await Asset.find({ ...base, vidaUtilMeses: { $gt: 0 }, valor: { $gt: 0 } })
    .select('patrimonio tipoEquipamento vidaUtilMeses dataServico dataAquisicao dnb')
    .populate('dnb', 'code')
    .lean();

  const vidaVencida = [];
  const vidaAVencer30 = [];

  for (const a of todosComVida) {
    const dataBase = a.dataServico || a.dataAquisicao;
    if (!dataBase) continue;
    const inicio = new Date(dataBase);
    const meses = (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth());
    const restante = a.vidaUtilMeses - meses;
    if (restante <= 0) vidaVencida.push(a);
    else if (restante <= 1) vidaAVencer30.push(a);
  }

  const naoLocalizadosMais90 = await Asset.find({
    ...base,
    statusLocalizacao: 'Não Localizado',
    updatedAt: { $lte: new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000) },
  })
    .select('patrimonio tipoEquipamento updatedAt dnb')
    .populate('dnb', 'code')
    .lean();

  return JSON.parse(JSON.stringify({
    vidaVencida,
    vidaAVencer30,
    naoLocalizadosMais90,
  }));
}
