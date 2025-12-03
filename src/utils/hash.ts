import crypto from 'node:crypto';

function getTokenHashSecret(): string {
  const secret = process.env.TOKEN_HASH_SECRET;
  if (!secret) {
    throw new Error('TOKEN_HASH_SECRET is missing');
  }
  return secret;
}

export function hashToken(token: string) {
  return crypto.createHmac('sha256', getTokenHashSecret()).update(token).digest('hex');
}

export function compareHash(token: string, storedHash: string) {
  const hashedToken = hashToken(token);
  return crypto.timingSafeEqual(Buffer.from(hashedToken), Buffer.from(storedHash));
}
