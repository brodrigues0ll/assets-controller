import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Asset from '@/lib/models/Asset';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patrimonio = searchParams.get('patrimonio');

  if (!patrimonio) {
    return NextResponse.json({ error: 'Parâmetro patrimônio é obrigatório' }, { status: 400 });
  }

  await connectDB();

  const asset = await Asset.findOne({ patrimonio: patrimonio.trim() })
    .populate('dnb', 'code name')
    .select('_id patrimonio tipoEquipamento subtipo fabricante situacao localizacaoSetor usuarioResponsavel dnb imagemUrl')
    .lean();

  if (!asset) {
    return NextResponse.json({ error: 'Ativo não encontrado' }, { status: 404 });
  }

  return NextResponse.json(JSON.parse(JSON.stringify(asset)));
}
