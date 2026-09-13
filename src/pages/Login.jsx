import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogIn, Loader2, Mail, ShieldCheck } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { safeReturnTo } from '@/lib/authReturnTo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();
  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await rpgStore.auth.loginViaEmailPassword(email);
      window.location.assign(returnTo);
    } catch (err) {
      setError(err.message || 'プロフィールを開けませんでした。');
    } finally { setLoading(false); }
  };
  return <AuthLayout icon={LogIn} title="サインイン" subtitle="この端末に保存した制作プロフィールを開きます。" footer={<>初めてですか？ <Link to={`/register${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="text-primary font-medium hover:underline">アカウントを作成</Link></>}>
    {error && <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="email">登録したメールアドレス</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} className="h-12 pl-10" required /></div></div>
      <div className="flex gap-2 rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />この独立版は、メール送信やパスワード保存を行いません。プロフィール情報はこの端末だけに保存されます。</div>
      <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />サインイン中...</> : <><LogIn className="mr-2 h-4 w-4" />サインイン</>}</Button>
      <Link to="/" className="flex items-center justify-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" />ホームへ戻る</Link>
    </form>
  </AuthLayout>;
}
