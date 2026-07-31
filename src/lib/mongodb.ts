import mongoose from 'mongoose';
import dns from 'dns';

// Resolver consultas DNS SRV no Windows/Node local
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {
  /* ignore on environments without setServers */
}

// Usar cache global para evitar múltiplas ligações em desenvolvimento (hot-reload)
declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: typeof import('mongoose') | null; promise: Promise<typeof import('mongoose')> | null } | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI não está definido. Adiciona-o ao .env.local ou às variáveis de ambiente da Vercel.');
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((m) => m);
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
