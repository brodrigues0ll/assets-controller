import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = process.env.MINIO_PORT || '9000';
const useSSL = process.env.MINIO_USE_SSL === 'true';
const protocol = useSSL ? 'https' : 'http';

export const minioClient = new S3Client({
  endpoint: `${protocol}://${endpoint}:${port}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

export const BUCKET = process.env.MINIO_BUCKET || 'infraledger';

export function getPublicUrl(fileName) {
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || `${protocol}://${endpoint}:${port}`;
  return `${publicEndpoint}/${BUCKET}/${fileName}`;
}

export async function ensureBucket() {
  try {
    await minioClient.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await minioClient.send(new CreateBucketCommand({ Bucket: BUCKET }));
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
      }],
    });
    await minioClient.send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: policy }));
  }
}
