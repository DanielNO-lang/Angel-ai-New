/**
 * ANGEL AI — Cryptographic Vault & Secret Chat Architecture
 * Implements real client-side cryptographic security using Web Crypto API (SubtleCrypto):
 * - Key Derivation: PBKDF2 with SHA-256 and 200,000 iterations over cryptographically random 16-byte salt
 * - Encryption: AES-GCM 256-bit with unique 12-byte initialization vectors (IV) per payload
 * - Ephemeral Key Lifecycle: Master key held strictly in memory while unlocked, auto-wiped on lock/timeout
 * - Encrypted at Rest: Secret chat messages and credentials never written in plaintext to localStorage or normal state
 */

export interface EncryptedPayload {
  version: 1;
  iv: string; // base64
  salt: string; // base64
  ciphertext: string; // base64 (includes 128-bit GCM tag)
  timestamp: string;
}

export interface SecretConversationRecord {
  id: string;
  encryptedTitle: EncryptedPayload;
  encryptedMessages: EncryptedPayload;
  createdAt: string;
  updatedAt: string;
}

export interface DecryptedSecretChat {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

class CryptoVaultService {
  private activeKey: CryptoKey | null = null;
  private autoLockTimeoutMs: number = 15 * 60 * 1000; // 15 minutes of inactivity
  private autoLockTimer: any = null;
  private onLockListeners: Array<() => void> = [];

  // Helper conversions
  private bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Derives a 256-bit AES-GCM CryptoKey using PBKDF2 with SHA-256
   */
  async deriveKey(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passcode),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations: 200000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable from memory
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Initializes or verifies passcode with verification hash
   */
  async unlockWithPasscode(passcode: string): Promise<boolean> {
    try {
      const storedSaltBase64 = localStorage.getItem('angel_vault_salt');
      const storedVerification = localStorage.getItem('angel_vault_verify');

      if (!storedSaltBase64 || !storedVerification) {
        // First-time setup: establish salt and verification token
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const key = await this.deriveKey(passcode, salt);
        const verificationPayload = await this.encryptWithKey('ANGEL_VAULT_VERIFIED', key, salt);

        localStorage.setItem('angel_vault_salt', this.bufferToBase64(salt));
        localStorage.setItem('angel_vault_verify', JSON.stringify(verificationPayload));

        this.activeKey = key;
        this.resetAutoLockTimer();
        return true;
      }

      // Existing vault: verify passcode by decrypting token
      const salt = this.base64ToBuffer(storedSaltBase64);
      const key = await this.deriveKey(passcode, salt);
      const parsedVerification: EncryptedPayload = JSON.parse(storedVerification);

      const decrypted = await this.decryptWithKey(parsedVerification, key);
      if (decrypted === 'ANGEL_VAULT_VERIFIED') {
        this.activeKey = key;
        this.resetAutoLockTimer();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  isUnlocked(): boolean {
    return this.activeKey !== null;
  }

  hasStoredVault(): boolean {
    return Boolean(
      localStorage.getItem('angel_vault_salt') && localStorage.getItem('angel_vault_verify')
    );
  }

  resetVault(): void {
    localStorage.removeItem('angel_vault_salt');
    localStorage.removeItem('angel_vault_verify');
    this.lock();
  }

  lock(): void {
    this.activeKey = null;
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
    this.onLockListeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore
      }
    });
  }

  subscribeToLock(callback: () => void): () => void {
    this.onLockListeners.push(callback);
    return () => {
      this.onLockListeners = this.onLockListeners.filter((cb) => cb !== callback);
    };
  }

  private resetAutoLockTimer(): void {
    if (this.autoLockTimer) clearTimeout(this.autoLockTimer);
    this.autoLockTimer = setTimeout(() => {
      this.lock();
    }, this.autoLockTimeoutMs);
  }

  /**
   * Encrypts plaintext string into an AES-GCM envelope
   */
  async encrypt(plaintext: string): Promise<EncryptedPayload> {
    if (!this.activeKey) {
      throw new Error('Cryptographic vault is locked. Unlock before encrypting.');
    }
    this.resetAutoLockTimer();

    const storedSalt = localStorage.getItem('angel_vault_salt');
    const salt = storedSalt ? this.base64ToBuffer(storedSalt) : window.crypto.getRandomValues(new Uint8Array(16));
    return await this.encryptWithKey(plaintext, this.activeKey, salt);
  }

  private async encryptWithKey(plaintext: string, key: CryptoKey, salt: Uint8Array): Promise<EncryptedPayload> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit standard IV
    const enc = new TextEncoder();
    const encoded = enc.encode(plaintext);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
      },
      key,
      encoded
    );

    return {
      version: 1,
      iv: this.bufferToBase64(iv),
      salt: this.bufferToBase64(salt),
      ciphertext: this.bufferToBase64(ciphertextBuffer),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Decrypts an AES-GCM envelope back into plaintext string
   */
  async decrypt(payload: EncryptedPayload): Promise<string> {
    if (!this.activeKey) {
      throw new Error('Cryptographic vault is locked. Unlock before decrypting.');
    }
    this.resetAutoLockTimer();
    return await this.decryptWithKey(payload, this.activeKey);
  }

  private async decryptWithKey(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
    const iv = this.base64ToBuffer(payload.iv);
    const ciphertext = this.base64ToBuffer(payload.ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
      },
      key,
      ciphertext as any
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  }

  /**
   * Changes vault passcode by re-encrypting with new derived key
   */
  async changePasscode(oldPasscode: string, newPasscode: string): Promise<boolean> {
    const unlocked = await this.unlockWithPasscode(oldPasscode);
    if (!unlocked) return false;

    const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
    const newKey = await this.deriveKey(newPasscode, newSalt);
    const newVerify = await this.encryptWithKey('ANGEL_VAULT_VERIFIED', newKey, newSalt);

    localStorage.setItem('angel_vault_salt', this.bufferToBase64(newSalt));
    localStorage.setItem('angel_vault_verify', JSON.stringify(newVerify));
    this.activeKey = newKey;
    return true;
  }
}

export const cryptoVault = new CryptoVaultService();
