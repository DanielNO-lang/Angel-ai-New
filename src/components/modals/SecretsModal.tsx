import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  MessageSquare,
  Plus,
  Trash2,
  X,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface SecretsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecretsModal: React.FC<SecretsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    conversations,
    createConversation,
    setActiveConversationId,
    deleteConversation,
    moveConversationToSecret,
    restoreConversationFromSecret,
    setActiveTab,
    secretsPasscode,
    setSecretsPasscode,
    isSecretsUnlocked,
    setIsSecretsUnlocked,
  } = useAngel();

  const isLight = settings.theme === 'light';

  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showChangePasscode, setShowChangePasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);
  const [isPasscodeVisible, setIsPasscodeVisible] = useState(false);

  if (!isOpen) return null;

  // Filter ONLY secret conversations
  const secretConversations = conversations.filter((c) => c.isSecret);

  const handleKeyClick = (digit: string) => {
    if (enteredPasscode.length < 6) {
      const next = enteredPasscode + digit;
      setEnteredPasscode(next);
      setErrorMessage('');
      if (next === secretsPasscode) {
        setIsSecretsUnlocked(true);
        setEnteredPasscode('');
      } else if (next.length === secretsPasscode.length) {
        setErrorMessage('Incorrect passcode. Try again.');
        setTimeout(() => setEnteredPasscode(''), 600);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPasscode((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleQuickUnlock = () => {
    setIsSecretsUnlocked(true);
    setEnteredPasscode('');
    setErrorMessage('');
  };

  const handleLockVault = () => {
    setIsSecretsUnlocked(false);
    setEnteredPasscode('');
    setShowChangePasscode(false);
  };

  const handleNewSecretChat = () => {
    const id = createConversation(undefined, undefined, 'Confidential Secret Chat');
    moveConversationToSecret(id);
    setActiveConversationId(id);
    setActiveTab('chat');
    onClose();
  };

  const handleOpenSecretChat = (convId: string) => {
    setActiveConversationId(convId);
    setActiveTab('chat');
    onClose();
  };

  const handleChangePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasscode.length < 4) {
      setErrorMessage('Passcode must be at least 4 digits');
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setErrorMessage('Passcodes do not match');
      return;
    }
    setSecretsPasscode(newPasscode);
    setChangeSuccess(true);
    setTimeout(() => {
      setChangeSuccess(false);
      setShowChangePasscode(false);
      setNewPasscode('');
      setConfirmPasscode('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10 transition-all duration-200 ${
          isLight
            ? 'bg-white text-slate-800 border border-slate-200'
            : 'bg-[#0E121B] text-neutral-100 border border-white/10'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isLight ? 'border-slate-100 bg-slate-50/70' : 'border-neutral-800/80 bg-neutral-900/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Secrets Vault</h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                {isSecretsUnlocked ? 'Private chats storage' : 'Passcode protected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isSecretsUnlocked && (
              <button
                onClick={handleLockVault}
                title="Lock Vault"
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight
                  ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isSecretsUnlocked ? (
          /* ========================================================
             PASSCODE UNLOCK SCREEN
             ======================================================== */
          <div className="p-6 space-y-6 text-center">
            <div className="space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold">Enter Passcode</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                Enter your {secretsPasscode.length}-digit passcode to unlock your secret chats
              </p>
            </div>

            {/* PIN Dots */}
            <div className="flex justify-center items-center gap-3">
              {Array.from({ length: secretsPasscode.length }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                    idx < enteredPasscode.length
                      ? 'bg-purple-500 ring-4 ring-purple-500/20 scale-110'
                      : isLight
                      ? 'bg-slate-200'
                      : 'bg-neutral-800'
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="text-xs text-red-500 font-medium animate-shake">{errorMessage}</p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeyClick(digit)}
                  className={`h-11 rounded-xl font-semibold text-sm transition-all duration-100 transform-gpu active:scale-95 ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80'
                      : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-100 border border-white/5'
                  }`}
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => setEnteredPasscode('')}
                className={`h-11 rounded-xl text-xs font-medium transition-colors ${
                  isLight
                    ? 'text-slate-500 hover:bg-slate-100'
                    : 'text-neutral-400 hover:bg-neutral-900'
                }`}
              >
                Clear
              </button>
              <button
                onClick={() => handleKeyClick('0')}
                className={`h-11 rounded-xl font-semibold text-sm transition-all duration-100 transform-gpu active:scale-95 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-100 border border-white/5'
                }`}
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className={`h-11 rounded-xl text-xs font-medium transition-colors flex items-center justify-center ${
                  isLight
                    ? 'text-slate-500 hover:bg-slate-100'
                    : 'text-neutral-400 hover:bg-neutral-900'
                }`}
              >
                ⌫
              </button>
            </div>

            {/* Default Passcode Helper */}
            <div className="pt-2">
              <button
                onClick={handleQuickUnlock}
                className={`text-[11px] underline underline-offset-2 transition-colors ${
                  isLight ? 'text-purple-600 hover:text-purple-700' : 'text-purple-400 hover:text-purple-300'
                }`}
              >
                Default passcode is 1234 • Click to unlock
              </button>
            </div>
          </div>
        ) : showChangePasscode ? (
          /* ========================================================
             CHANGE PASSCODE SCREEN
             ======================================================== */
          <form onSubmit={handleChangePasscodeSubmit} className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-inherit">
              <h3 className="text-sm font-semibold">Change Vault Passcode</h3>
              <button
                type="button"
                onClick={() => setShowChangePasscode(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {changeSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Passcode updated successfully!</span>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium">New Passcode (digits)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-6 digits"
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-800'
                        : 'bg-neutral-900 border-neutral-700 text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Confirm Passcode</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Re-enter passcode"
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-800'
                        : 'bg-neutral-900 border-neutral-700 text-white'
                    }`}
                  />
                </div>

                {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}

                <button
                  type="submit"
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Save Passcode
                </button>
              </>
            )}
          </form>
        ) : (
          /* ========================================================
             UNLOCKED SECRETS VAULT (CHATS ONLY)
             ======================================================== */
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleNewSecretChat}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Secret Chat</span>
              </button>

              <button
                onClick={() => setShowChangePasscode(true)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  isLight
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    : 'border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                Change Passcode
              </button>
            </div>

            {/* Secret Chats List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider px-1 opacity-70">
                <span>Confidential Chats ({secretConversations.length})</span>
                <span>Protected</span>
              </div>

              {secretConversations.length === 0 ? (
                <div
                  className={`p-6 rounded-2xl text-center space-y-2 border border-dashed ${
                    isLight ? 'border-slate-200 bg-slate-50/50' : 'border-neutral-800 bg-neutral-900/30'
                  }`}
                >
                  <Lock className="w-8 h-8 mx-auto text-purple-400 opacity-60" />
                  <p className="text-xs font-semibold">No secret chats yet</p>
                  <p className={`text-[11px] max-w-xs mx-auto ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Click "Save to secrets" in any chat's 3-dot options menu to remove it from your main sidebar and store it securely here.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {secretConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isLight
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800'
                          : 'bg-neutral-900/60 hover:bg-neutral-900 border-white/5 text-neutral-200'
                      }`}
                    >
                      <div
                        onClick={() => handleOpenSecretChat(conv.id)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <h4 className="text-xs font-semibold truncate group-hover:text-purple-400 transition-colors">
                            {conv.title}
                          </h4>
                        </div>
                        <p
                          className={`text-[10px] truncate mt-0.5 ${
                            isLight ? 'text-slate-500' : 'text-neutral-400'
                          }`}
                        >
                          {conv.lastMessagePreview || 'Confidential conversation'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Restore to regular chats */}
                        <button
                          onClick={() => restoreConversationFromSecret(conv.id)}
                          title="Restore to regular chats"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isLight
                              ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200'
                              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete secret chat */}
                        <button
                          onClick={() => deleteConversation(conv.id)}
                          title="Delete permanently"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className={`p-3 rounded-xl text-[11px] flex items-center gap-2 border ${
                isLight
                  ? 'bg-purple-50/60 border-purple-200/60 text-purple-900'
                  : 'bg-purple-950/20 border-purple-500/20 text-purple-300'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-purple-400" />
              <span>
                Secret chats are excluded from your main sidebar and search until you unlock them here.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
