import crypto from 'crypto';
import bcrypt from "bcryptjs";

export function generateRawToken(digits = 6) {
  const max = 10 ** digits;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(digits, '0');
}

export async function hashToken(raw: string) {
  const rounds = 10;
  return await bcrypt.hash(raw, rounds);
}

export async function compareToken(raw: string, hash: string) {
  return await bcrypt.compare(raw, hash);
}