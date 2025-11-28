import crypto from "node:crypto"

export function hashToken(token: string) {
    return crypto
        .createHmac("sha256", process.env.TOKEN_HASH_SECRET!)
        .update(token)
        .digest("hex")
}

export function compareHash(token: string, storedHash: string) {
    const hashedToken = hashToken(token);
    return crypto.timingSafeEqual(Buffer.from(hashedToken), Buffer.from(storedHash))
}