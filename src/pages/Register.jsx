import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, User, UserPlus } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { safeReturnTo } from '@/lib/authReturnTo';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();
  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await rpgStore.auth.register({ email, full_name: name });
      window.location.assign(returnTo);
    } catch (err) {
      setError(err.message || 'プロフィールを作成できませんでした。');
    } finally { setLoading(false); }
  };
  return <AuthLayout icon={UserPlus} title="制作プロフィールを作る" subtitle="Suiram RPG Editはこの端末だけにプロフィールを保存します。" footer={<>作成済みですか？ <Link to={`/login${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="text-primary font-medium hover:underline">プロフィールを開く</Link></>}>
    {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="name">表示名</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="name" autoFocus placeholder="あなたの名前" value={name} onChange={event => setName(event.target.value)} className="pl-10 h-12" required /></div></div>
      <div className="space-y-2"><Label htmlFor="email">メールアドレス</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} className="pl-10 h-12" required /></div></div>
      <p className="text-xs text-muted-foreground">メールは端末内のプロフィール識別だけに使われ、外部へ送信されません。</p>
      <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />作成しています...</> : 'プロフィールを作成'}</Button>
    </form>
  </AuthLayout>;
}
