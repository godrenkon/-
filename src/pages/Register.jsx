import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Mail, ShieldCheck, User, UserPlus } from 'lucide-react';
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
  return <AuthLayout icon={UserPlus} title="アカウントを作成" subtitle="ゲームや素材を端末内に保存するための制作プロフィールです。" footer={<>作成済みですか？ <Link to={`/login${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="text-primary font-medium hover:underline">サインイン</Link></>}>
    {error && <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="name">表示名</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="name" autoFocus autoComplete="name" placeholder="あなたの名前" value={name} onChange={event => setName(event.target.value)} className="h-12 pl-10" maxLength={48} required /></div></div>
      <div className="space-y-2"><Label htmlFor="email">メールアドレス</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} className="h-12 pl-10" required /></div></div>
      <div className="flex gap-2 rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />メールはプロフィールを区別するためにこの端末へ保存するだけで、外部には送信しません。</div>
      <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />作成中...</> : <><UserPlus className="mr-2 h-4 w-4" />アカウントを作成</>}</Button>
      <Link to="/" className="flex items-center justify-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" />ホームへ戻る</Link>
    </form>
  </AuthLayout>;
}
