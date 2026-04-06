import * as crypto from 'crypto';

/**
 * 양방향 암호화 유틸 (AES-256-GCM)
 * SMTP 비밀번호 등 복호화가 필요한 민감 정보 저장에 사용
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getMasterKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    // 개발 환경 기본값 (운영 시 .env에 32자 이상 키 필수)
    return 'dev-encryption-key-change-in-production-32chars';
  }
  return key;
}

/** 평문 → 암호화된 base64 문자열 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';

  const masterKey = getMasterKey();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // salt + iv + tag + ciphertext 를 base64로 인코딩
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

/** 암호화된 base64 → 평문 */
export function decrypt(ciphertextB64: string): string {
  if (!ciphertextB64) return '';

  try {
    const masterKey = getMasterKey();
    const buf = Buffer.from(ciphertextB64, 'base64');

    const salt = buf.subarray(0, SALT_LENGTH);
    const iv = buf.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buf.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buf.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}
