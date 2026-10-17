import React, { useCallback, useEffect, useState } from 'react';
import { Download, FileCode2, FileText, LoaderCircle, Plus, Save, Trash2, X } from 'lucide-react';
import { getClientSupabase } from '../../services/supabaseService';

type Kind = 'document' | 'code' | 'plan' | 'media' | 'research';
type Artifact = { id: string; title: string; kind: Kind; content: string; asset_url?: string | null; mime_type?: string | null; version: number; created_at: string; updated_at: string };

export const PersistentArtifactsPanel: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const [token, setToken] = useState('');
  const [items, setItems] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<Kind>('document');
  const [content, setContent] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const client = getClientSupabase();
    if (!client) return;
    let active = true;
    void client.auth.getSession().then(({ data }) => { if (active) setToken(data.session?.access_token || ''); });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setToken(session?.access_token || '');
      setItems([]);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const headers = useCallback(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);
  const load = useCallback(async () => {
    if (!token) { setItems([]); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/artifacts?limit=50', { headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load saved artifacts.');
      setItems(Array.isArray(data.artifacts) ? data.artifacts : []);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load saved artifacts.'); }
    finally { setLoading(false); }
  }, [token, headers]);
  useEffect(() => { void load(); }, [load]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !title.trim() || saving) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ title: title.trim(), kind, content, assetUrl: assetUrl.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Artifact could not be saved.');
      setItems((current) => [data, ...current]);
      setTitle(''); setContent(''); setAssetUrl(''); setKind('document'); setShowForm(false);
      setNotice('Saved to your signed-in cloud workspace.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Artifact could not be saved.'); }
    finally { setSaving(false); }
  };

  const saveEdit = async (id: string) => {
    if (!token || saving) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch(`/api/artifacts/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ title: editTitle.trim(), content: editContent }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Artifact changes could not be saved.');
      setItems((current) => current.map((item) => item.id === id ? data : item));
      setEditing(null); setNotice('Artifact changes saved.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Artifact changes could not be saved.'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!token || !window.confirm('Delete this cloud artifact? This cannot be undone.')) return;
    setError(''); setNotice('');
    try {
      const response = await fetch(`/api/artifacts/${encodeURIComponent(id)}`, { method: 'DELETE', headers: headers() });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Artifact could not be deleted.');
      }
      setItems((current) => current.filter((item) => item.id !== id));
      setNotice('Artifact deleted from your cloud workspace.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Artifact could not be deleted.'); }
  };

  const download = (item: Artifact) => {
    const blob = new Blob([item.content || item.asset_url || ''], { type: item.mime_type || (item.kind === 'code' ? 'text/plain' : 'text/markdown') });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = item.title.replace(/[^a-z0-9._-]+/gi, '_') || 'angel-artifact';
    link.click(); URL.revokeObjectURL(url);
  };

  const card = isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white/[0.03] text-neutral-100';
  const muted = isLight ? 'text-slate-500' : 'text-neutral-400';
  return <section className={`rounded-2xl border p-4 sm:p-5 ${card}`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div>
      <h2 className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-indigo-400" />Persistent work artifacts</h2>
      <p className={`mt-1 text-xs ${muted}`}>Editable documents, code, plans, research notes, and media references saved across devices.</p>
    </div><button type="button" disabled={!token} onClick={() => setShowForm((v) => !v)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> New artifact</button></div>
    {error && <p role="alert" className="mt-3 rounded-xl border border-rose-500/25 p-3 text-xs text-rose-500">{error}</p>}
    {notice && !error && <p role="status" className="mt-3 rounded-xl border border-emerald-500/25 p-3 text-xs text-emerald-500">{notice}</p>}
    {!token && <p className={`mt-3 text-xs ${muted}`}>Sign in to store private artifacts across devices. Guests cannot save to the cloud workspace.</p>}
    {showForm && <form onSubmit={create} className="mt-4 grid gap-3 rounded-xl border border-indigo-500/20 p-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} placeholder="Artifact title" className={`rounded-lg border px-3 py-2 text-sm ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/20'}`} />
      <div className="grid gap-3 sm:grid-cols-2"><select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className={`rounded-lg border px-3 py-2 text-sm ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-black/20'}`}><option value="document">Document</option><option value="code">Code</option><option value="plan">Plan</option><option value="research">Research notes</option><option value="media">Media reference</option></select><input value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} placeholder="Optional media URL (https://…)" className={`min-w-0 rounded-lg border px-3 py-2 text-sm ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-black/20'}`} /></div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={2_000_000} rows={4} placeholder={kind === 'code' ? 'Paste or write code…' : 'Write or paste artifact content…'} className={`w-full rounded-lg border px-3 py-2 font-mono text-xs ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/20'}`} />
      <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className={`rounded-lg border px-3 py-2 text-xs ${card}`}><X className="mr-1 inline h-3.5 w-3.5" /> Cancel</button><button type="submit" disabled={saving || !title.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save artifact</button></div>
    </form>}
    <div className="mt-4 space-y-2">{loading && <p className={`text-xs ${muted}`}>Loading cloud artifacts…</p>}{!loading && token && items.length === 0 && <p className={`text-xs ${muted}`}>No cloud artifacts saved yet.</p>}
      {items.map((item) => <article key={item.id} className="rounded-xl border border-inherit p-3">{editing === item.id ? <div className="space-y-2"><input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={200} className={`w-full rounded-lg border px-3 py-2 text-sm ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-black/20'}`} /><textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} maxLength={2_000_000} rows={4} className={`w-full rounded-lg border px-3 py-2 font-mono text-xs ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-black/20'}`} /><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-inherit px-3 py-1.5 text-xs">Cancel</button><button type="button" onClick={() => void saveEdit(item.id)} disabled={saving || !editTitle.trim()} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Save edits</button></div></div> : <div className="flex items-start gap-3">
        <span className={`rounded-lg p-2 ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-300'}`}>{item.kind === 'code' ? <FileCode2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span>
        <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{item.title}</p><p className={`mt-1 text-[10px] uppercase tracking-wide ${muted}`}>{item.kind} · v{item.version} · Updated {new Date(item.updated_at).toLocaleDateString()}</p>{item.content && <p className={`mt-2 whitespace-pre-wrap text-xs leading-5 ${muted}`}>{item.content.slice(0, 200)}{item.content.length > 200 ? '…' : ''}</p>}{item.asset_url && <a href={item.asset_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-xs text-indigo-400 underline">Open media reference</a>}</div>
        <div className="flex shrink-0 gap-1"><button type="button" onClick={() => { setEditing(item.id); setEditTitle(item.title); setEditContent(item.content || ''); }} aria-label={`Edit ${item.title}`} className="rounded-lg border border-inherit px-2 py-1 text-[10px]">Edit</button><button type="button" onClick={() => download(item)} aria-label={`Download ${item.title}`} className="rounded-lg p-1.5 hover:bg-indigo-500/10"><Download className="h-3.5 w-3.5" /></button><button type="button" onClick={() => void remove(item.id)} aria-label={`Delete ${item.title}`} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></button></div>
      </div>}</article>)}
    </div>
  </section>;
};
