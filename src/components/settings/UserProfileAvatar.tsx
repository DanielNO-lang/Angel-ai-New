import React, { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { getClientSupabase } from '../../services/supabaseService';

interface UserProfileAvatarProps {
  name: string;
  initials?: string;
  fallbackUrl?: string;
  className?: string;
  onAvatarResolved?: (url: string) => void;
}

/** Resolves the authenticated user's avatar from real Supabase metadata. */
export const UserProfileAvatar: React.FC<UserProfileAvatarProps> = ({
  name,
  initials,
  fallbackUrl,
  className = '',
  onAvatarResolved,
}) => {
  const [metadataAvatar, setMetadataAvatar] = useState('');
  const [failedUrl, setFailedUrl] = useState('');

  useEffect(() => {
    const client = getClientSupabase();
    if (!client) return;
    let active = true;
    const publish = (user: any) => {
      const raw = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
      const candidate = typeof raw === 'string' && /^https:\/\//i.test(raw) ? raw : '';
      if (!active) return;
      setMetadataAvatar(candidate);
      setFailedUrl('');
      if (candidate && !fallbackUrl) onAvatarResolved?.(candidate);
    };
    void client.auth.getUser().then(({ data, error }) => {
      if (!error) publish(data.user);
    }).catch(() => {});
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => publish(session?.user));
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [fallbackUrl, onAvatarResolved]);

  const url = fallbackUrl || metadataAvatar;
  const safeUrl = url !== failedUrl ? url : '';
  const letters = (initials || name.split(/\s+/).map((part) => part[0]).filter(Boolean).join('').slice(0, 2) || 'U').toUpperCase();

  if (safeUrl) {
    return <img src={safeUrl} alt={`${name || 'User'} avatar`} onError={() => setFailedUrl(safeUrl)}
      className={`h-20 w-20 rounded-full object-cover ${className}`} />;
  }
  return (
    <div aria-label={`${name || 'User'} avatar`} className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-xl font-bold text-white ${className}`}>
      {letters || <UserRound className="h-6 w-6" />}
    </div>
  );
};
