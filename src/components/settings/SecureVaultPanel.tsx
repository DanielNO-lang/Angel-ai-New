import React, { useState } from 'react';
import { Lock, Unlock, ShieldCheck } from 'lucide-react';
import { useAngel } from '../../context/AppContext';

/**
 * AES-GCM local vault controls. Cloud-side encryption is a separate rollout step;
 * this panel intentionally labels exactly what is currently protected.
 */
export const SecureVaultPanel: React.FC = () => {
  const {
    secureVaultEnabled,
    secureVaultUnlocked,
    settings,
    enableSecureVault,
    unlockSecureVault,
    lockSecureVault,
    isLight,
  } = useAngel();
  const light = settings.theme === 'light';
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await action();
      setPassphrase('');
      setConfirmation('');
      setMessage('Secure Vault state updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Secure Vault could not complete the request.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (secureVaultEnabled) {
      await run(() => unlockSecureVault(passphrase));
      return;
    }
    if (passphrase !== confirmation) {
      setError('The passphrases do not match.');
      return;
    }
    await run(() => enableSecureVault(passphrase));
  };

  return (
    <section className="space-y-4 py-2">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${light ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-neutral-200'}`}>
          {secureVaultUnlocked ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Secure Vault</h3>
          <p className={`text-xs mt-0.5 ${light ? 'text-slate-500' : 'text-neutral-400'}`}>
            {secureVaultEnabled ? (secureVaultUnlocked ? 'Unlocked on this device' : 'Locked on this device') : 'Not configured'}
          </p>
        </div>
        {secureVaultEnabled && secureVaultUnlocked && (
          <button type="button" onClick={() => void run(lockSecureVault)} disabled={busy}
            className={`inline-flex items-center gap-2 text-xs transition-colors disabled:opacity-50 ${light ? 'text-slate-600 hover:text-slate-950' : 'text-neutral-300 hover:text-white'}`}>
            <Lock className="h-3.5 w-3.5" /> Lock
          </button>
        )}
      </div>

      {(!secureVaultEnabled || !secureVaultUnlocked) && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="angel-vault-passphrase" className="block text-xs font-medium">Master passphrase</label>
            <input id="angel-vault-passphrase" type="password" autoComplete="new-password"
              minLength={12} required value={passphrase} onChange={(event) => setPassphrase(event.target.value)}
              placeholder="At least 12 characters"
              className={`w-full bg-transparent px-0 py-2 text-sm outline-none border-b focus:border-indigo-500 ${light ? 'border-slate-300 text-slate-900' : 'border-white/15 text-white'}`} />
          </div>
          {!secureVaultEnabled && (
            <div className="space-y-1.5">
              <label htmlFor="angel-vault-confirm" className="block text-xs font-medium">Confirm passphrase</label>
              <input id="angel-vault-confirm" type="password" autoComplete="new-password"
                minLength={12} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)}
                placeholder="Enter the same passphrase"
                className={`w-full bg-transparent px-0 py-2 text-sm outline-none border-b focus:border-indigo-500 ${light ? 'border-slate-300 text-slate-900' : 'border-white/15 text-white'}`} />
            </div>
          )}
          <button type="submit" disabled={busy}
            className={`inline-flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 ${light ? 'text-indigo-700 hover:text-indigo-900' : 'text-indigo-300 hover:text-white'}`}>
            {secureVaultEnabled ? <Unlock className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {busy ? 'Working…' : secureVaultEnabled ? 'Unlock vault' : 'Set up vault'}
          </button>
        </form>
      )}

      {message && <p role="status" className="text-xs text-emerald-500">{message}</p>}
      {error && <p role="alert" className="text-xs text-rose-500">{error}</p>}

      <p className={`text-xs leading-relaxed ${light ? 'text-slate-500' : 'text-neutral-400'}`}>
        When enabled and unlocked, task and memory records in this browser’s IndexedDB are stored using AES-256-GCM encryption. The passphrase is not uploaded and the key is kept in memory. Losing it means these local encrypted records cannot be recovered. Existing cloud records and every other workspace field are not yet covered by this vault, so this is not a whole-app zero-knowledge guarantee.
      </p>
    </section>
  );
};
