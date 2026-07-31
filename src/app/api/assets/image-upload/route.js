import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Asset from '@/lib/models/Asset';
import { minioClient, BUCKET, getPublicUrl, ensureBucket } from '@/lib/minio';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 10;

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  if (!['gestor', 'administrador'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const assetId = formData.get('assetId');

    if (!file || !assetId) {
      return NextResponse.json({ error: 'Arquivo e assetId são obrigatórios' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.byteLength > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.` }, { status: 400 });
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = `assets/${assetId}-${Date.now()}.${ext}`;

    await ensureBucket();

    await minioClient.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    }));

    const imageUrl = getPublicUrl(fileName);

    await connectDB();
    await Asset.findByIdAndUpdate(assetId, { imagemUrl: imageUrl });

    return NextResponse.json({ url: imageUrl });
  } catch (err) {
    console.error('Erro no upload de imagem:', err);
    return NextResponse.json({ error: 'Erro ao fazer upload da imagem. Verifique se o MinIO está rodando.' }, { status: 500 });
  }
}
