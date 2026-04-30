import crypto from 'crypto';

// ─── In-memory store (replace with DB in production) ──────────────────────────
// Structure: { 'email:purpose': { otp, expiresAt, attempts } }
const otpStore = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000;   // 10 minutes
const MAX_ATTEMPTS = 5;                   // max wrong guesses before invalidation
const RESEND_COOLDOWN_MS = 60 * 1000;    // 1 minute between resend requests

// ─── Generate OTP ──────────────────────────────────────────────────────────────
export function generateOTP() {
  // 6-digit cryptographically secure OTP
  return crypto.randomInt(100000, 999999);
}

// ─── Store OTP ─────────────────────────────────────────────────────────────────
export function storeOTP(email, otp, purpose = 'verification') {
  const key = `${email}:${purpose}`;
  console.log("Storing OTP with key: ", key);
  const existing = otpStore.get(key);

  // Remove any existing OTP entries for this email (any purpose)
  for (const k of otpStore.keys()) {
    if (k.startsWith(`${email}:`)) {
      otpStore.delete(k);
    }
  }

  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    resendAfter: Date.now() + RESEND_COOLDOWN_MS,
    attempts: 0,
  });
}

// ─── Verify OTP ────────────────────────────────────────────────────────────────
export function verifyOTP(email, submittedOTP, purpose = 'verification') {
  const key = `${email}:${purpose}`;
  console.log("Key: ", key);
  const record = otpStore.get(key);
  console.log("Record: ", record);

  if (!record) {
    return { valid: false, error: 'No verification code found. Please request a new one.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, error: 'Verification code has expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { valid: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  if (Number(record.otp) !== Number(submittedOTP)) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return { valid: false, error: `Incorrect code. ${remaining} attempt(s) remaining.` };
  }

  // ✅ Valid — delete so it can't be reused
  otpStore.delete(key);
  return { valid: true };
}

// ─── Cleanup expired OTPs (call on a cron/interval) ───────────────────────────
export function cleanupExpiredOTPs() {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(key);
      cleaned++;
    }
  }
  return cleaned;
}