import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Por favor defina a variável MONGODB_URI no arquivo .env');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

function buildUri(uri) {
  // Remove ?authSource=... da URI e passa via opções separadas
  // Evita problemas de truncamento em ambientes como ZimaOS
  try {
    const url = new URL(uri);
    const authSource = url.searchParams.get('authSource');
    url.searchParams.delete('authSource');
    return { cleanUri: url.toString(), authSource };
  } catch {
    return { cleanUri: uri, authSource: null };
  }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const { cleanUri, authSource } = buildUri(MONGODB_URI);

    const resolvedAuthSource = authSource || process.env.MONGODB_AUTH_SOURCE || null;

    const opts = {
      bufferCommands: false,
      ...(resolvedAuthSource ? { authSource: resolvedAuthSource } : {}),
    };

    cached.promise = mongoose.connect(cleanUri, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
