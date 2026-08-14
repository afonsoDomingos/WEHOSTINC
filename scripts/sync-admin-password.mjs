import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnv(envPath);
const uri = env.MONGODB_URI;
const hash = env.ADMIN_DEFAULT_PASSWORD_HASH;

if (!uri || !hash) {
  console.error('Missing MONGODB_URI or ADMIN_DEFAULT_PASSWORD_HASH in .env.local');
  process.exit(1);
}

await mongoose.connect(uri);
const col = mongoose.connection.db.collection('users');
const before = await col.findOne({ email: 'admin@wehosthere.com' });

console.log('Admin antes:', before
  ? { email: before.email, hasPassword: !!before.password, passwordMatch: before.password === hash }
  : 'NAO EXISTE');

const result = await col.updateOne(
  { email: 'admin@wehosthere.com' },
  {
    $set: {
      password: hash,
      role: 'admin',
      status: 'active',
      plan: 'enterprise',
      id: before?.id || 'admin_root',
      name: before?.name || 'Administrador WEHOSTHERE',
    },
  },
  { upsert: true }
);

const after = await col.findOne({ email: 'admin@wehosthere.com' });
console.log('Resultado:', {
  matched: result.matchedCount,
  modified: result.modifiedCount,
  upserted: result.upsertedCount,
});
console.log('Admin depois:', {
  email: after.email,
  passwordSynced: after.password === hash,
  role: after.role,
});

const testPassword = process.argv[2];
if (testPassword) {
  const valid = await bcrypt.compare(testPassword, after.password);
  console.log('Login test (bcrypt):', valid ? 'OK' : 'FALHOU');
}

await mongoose.disconnect();
