/**
 * Angel AI client-side secure vault.
 *
 * AES-256-GCM encrypts records before persistence. The master passphrase is
 * stretched with PBKDF2-SHA-256; only salt + an encrypted verifier are stored.
 * The derived CryptoKey lives in memory and is discarded on lock/sign-out.
 */
export interface EncryptedPayload {
  version: 1;
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA-256';
  salt: string;
  iv: string;
  ciphertext: string;
  createdAt: string;
}

interface VaultMetadata {
  version: 1;
  salt: string;
  verifier: EncryptedPayload;
  createdAt: string;
}

const METADATA_KEY = 'angel_secure_vault_v1';
const VERIFIER = 'angel-vault-verifier-v1';
const PBKDF2_ITERATIONS = 310_000;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function readMetadata(): VaultMetadata | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(METADATA_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as VaultMetadata;
    if (value.version !== 1 || !value.salt || !value.verifier?.ciphertext) return null;
    return value;
  } catch {
    return null;
  }
}

class SecureVaultService {
  private key: CryptoKey | null = null;
  private salt: string | null = null;

  isEnabled(): boolean {
    return readMetadata() !== null;
  }

  isUnlocked(): boolean {
    return this.key !== null;
  }

  async enable(passphrase: string): Promise<void> {
    if (passphrase.trim().length < 12) {
      throw new Error('Use a secure vault passphrase of at least 12 characters.');
    }
    if (this.isEnabled()) {
      await this.unlock(passphrase);
      return;
    }

    const saltBytes = randomBytes(16);
    const salt = bytesToBase64(saltBytes);
    const key = await this.deriveKey(passphrase, saltBytes);
    const verifier = await this.encryptWithKey(VERIFIER, key, salt);
    const metadata: VaultMetadata = {
      version: 1,
      salt,
      verifier,
      createdAt: new Date().toISOString(),
    };

    if (typeof localStorage === 'undefined') {
      throw new Error('Secure Vault requires browser storage.');
    }
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    this.salt = salt;
    this.key = key;
  }

  async unlock(passphrase: string): Promise<void> {
    const metadata = readMetadata();
    if (!metadata) throw new Error('Secure Vault has not been configured on this device.');
    const key = await this.deriveKey(passphrase, base64ToBytes(metadata.salt));
    try {
      const verifier = await this.decryptWithKey<string>(metadata.verifier, key);
      if (verifier !== VERIFIER) throw new Error('The passphrase is incorrect.');
    } catch {
      this.lock();
      throw new Error('Unable to unlock Secure Vault. Check your passphrase.');
    }
    this.salt = metadata.salt;
    this.key = key;
  }

  lock(): void {
    this.key = null;
    this.salt = null;
  }

  async encryptJson<T>(value: T): Promise<EncryptedPayload> {
    if (!this.key || !this.salt) {
      throw new Error('Secure Vault is locked. Unlock it before saving sensitive data.');
    }
    return this.encryptWithKey(JSON.stringify(value), this.key, this.salt);
  }

  async decryptJson<T>(payload: EncryptedPayload): Promise<T> {
    if (!this.key) throw new Error('Secure Vault is locked.');
    return this.decryptWithKey<T>(payload, this.key);
  }

  private async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    if (!globalThis.crypto?.subtle) {
      throw new Error('Web Crypto is unavailable. Use a supported browser over HTTPS.');
    }
    const material = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  private async encryptWithKey(
    plainText: string,
    key: CryptoKey,
    salt: string,
  ): Promise<EncryptedPayload> {
    const iv = randomBytes(12);
    const additionalData = textEncoder.encode('angel-secure-vault:v1');
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData, tagLength: 128 },
      key,
      textEncoder.encode(plainText),
    );
    return {
      version: 1,
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA-256',
      salt,
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(encrypted)),
      createdAt: new Date().toISOString(),
    };
  }

  private async decryptWithKey<T>(payload: EncryptedPayload, key: CryptoKey): Promise<T> {
    if (payload.version !== 1 || payload.algorithm !== 'AES-256-GCM') {
      throw new Error('Unsupported encrypted record version.');
    }
    const plain = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToBytes(payload.iv),
        additionalData: textEncoder.encode('angel-secure-vault:v1'),
        tagLength: 128,
      },
      key,
      base64ToBytes(payload.ciphertext),
    );
    return JSON.parse(textDecoder.decode(plain)) as T;
  }
}

export const secureVaultService = new SecureVaultService();
