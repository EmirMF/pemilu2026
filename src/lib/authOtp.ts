import crypto from 'crypto';
import redis from '@/lib/redis';

export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_MAX_ATTEMPTS = 5;
export const STUDENT_EMAIL_DOMAIN = '@mahasiswa.itb.ac.id';

type StoredOtpChallenge = {
  hash: string;
  attempts: number;
  createdAt: number;
};

function getOtpKey(email: string) {
  return `auth:otp:${normalizeStudentEmail(email)}`;
}

export function buildStudentEmailFromNim(nim: string) {
  return `${normalizeNim(nim)}${STUDENT_EMAIL_DOMAIN}`;
}

export function normalizeStudentEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeNim(nim: string) {
  return nim.trim().toLowerCase();
}

export function isValidNim(nim: string) {
  return /^\d{8}$/.test(normalizeNim(nim));
}

export function isValidStudentEmail(email: string) {
  const normalizedEmail = normalizeStudentEmail(email);
  return /^[a-z0-9._%+-]+@mahasiswa\.itb\.ac\.id$/.test(normalizedEmail);
}

export function generateOtpCode() {
  const otp = crypto.randomInt(0, 1_000_000);
  return otp.toString().padStart(6, '0');
}

function hashOtpCode(email: string, otpCode: string) {
  const normalizedEmail = normalizeStudentEmail(email);
  return crypto.createHash('sha256').update(`${normalizedEmail}:${otpCode}`).digest('hex');
}

function timingSafeEqualHex(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export async function saveOtpChallenge(email: string, otpCode: string) {
  const challenge: StoredOtpChallenge = {
    hash: hashOtpCode(email, otpCode),
    attempts: 0,
    createdAt: Date.now(),
  };

  await redis.setex(getOtpKey(email), OTP_TTL_SECONDS, JSON.stringify(challenge));
}

export async function getOtpChallenge(email: string): Promise<StoredOtpChallenge | null> {
  const raw = await redis.get(getOtpKey(email));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredOtpChallenge;
  } catch {
    await redis.del(getOtpKey(email));
    return null;
  }
}

export async function getOtpChallengeTtl(email: string) {
  return redis.ttl(getOtpKey(email));
}

export async function deleteOtpChallenge(email: string) {
  await redis.del(getOtpKey(email));
}

export function verifyOtpCode(email: string, otpCode: string, challenge: StoredOtpChallenge) {
  return timingSafeEqualHex(challenge.hash, hashOtpCode(email, otpCode));
}

export async function incrementOtpAttempts(email: string) {
  const challenge = await getOtpChallenge(email);
  if (!challenge) {
    return null;
  }

  challenge.attempts += 1;

  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    await deleteOtpChallenge(email);
    return challenge;
  }

  await redis.setex(getOtpKey(email), OTP_TTL_SECONDS, JSON.stringify(challenge));
  return challenge;
}
