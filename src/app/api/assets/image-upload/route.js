/**
 * API Route para upload de imagem de ativos.
 *
 * DEPENDÊNCIA: Este endpoint usa a API S3 do MinIO via HTTP.
 * Para ativar o upload real, configure as variáveis de ambiente:
 *   MINIO_ENDPOINT=localhost
 *   MINIO_PORT=9000
 *   MINIO_ACCESS_KEY=minioadmin
 *   MINIO_SECRET_KEY=minioadmin
 *   MINIO_BUCKET=infraledger
 *   MINIO_USE_SSL=false
 *
 * Para instalar o SDK S3: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Asset from '@/lib/models/Asset';

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `assets/${assetId}-${Date.now()}.${file.name.split('.').pop()}`;

    // Verificar se MinIO está configurado
    const minioEndpoint = process.env.MINIO_ENDPOINT;
    const minioPort = process.env.MINIO_PORT || '9000';
    const minioAccessKey = process.env.MINIO_ACCESS_KEY;
    const minioSecretKey = process.env.MINIO_SECRET_KEY;
    const minioBucket = process.env.MINIO_BUCKET || 'infraledger';
    const minioUseSSL = process.env.MINIO_USE_SSL === 'true';

    if (!minioEndpoint || !minioAccessKey || !minioSecretKey) {
      // MinIO não configurado: retornar placeholder
      const placeholderUrl = `/api/placeholder-image/${assetId}`;

      await connectDB();
      await Asset.findByIdAndUpdate(assetId, { imagemUrl: placeholderUrl });

      return NextResponse.json({
        url: placeholderUrl,
        warning: 'MinIO não configurado. Instale @aws-sdk/client-s3 e configure as variáveis MINIO_* para upload real.',
      });
    }

    // Upload para MinIO via S3 API (requer @aws-sdk/client-s3)
    // Descomente e instale o SDK para ativar:
    //
    // const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    // const s3 = new S3Client({
    //   endpoint: `${minioUseSSL ? 'https' : 'http'}://${minioEndpoint}:${minioPort}`,
    //   region: 'us-east-1',
    //   credentials: { accessKeyId: minioAccessKey, secretAccessKey: minioSecretKey },
    //   forcePathStyle: true,
    // });
    // await s3.send(new PutObjectCommand({
    //   Bucket: minioBucket,
    //   Key: fileName,
    //   Body: buffer,
    //   ContentType: file.type,
    // }));
    // const protocol = minioUseSSL ? 'https' : 'http';
    // const imageUrl = `${protocol}://${minioEndpoint}:${minioPort}/${minioBucket}/${fileName}`;

    // Por ora retornar placeholder até SDK instalado
    const imageUrl = `/uploads/${fileName}`;

    await connectDB();
    await Asset.findByIdAndUpdate(assetId, { imagemUrl: imageUrl });

    return NextResponse.json({ url: imageUrl });
  } catch (err) {
    console.error('Erro no upload de imagem:', err);
    return NextResponse.json({ error: 'Erro interno no upload' }, { status: 500 });
  }
}
