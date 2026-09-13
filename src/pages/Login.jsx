import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, KeyRound, Loader2, LogIn, Mail, ShieldCheck } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { safeReturnTo } from '@/lib/authReturnTo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();
  const handleSubmit = async event => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const result = await rpgStore.auth.loginViaEmailPassword(email, password);
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        window.location.assign(`/confirm-account?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      if (result.nextStep?.signInStep === 'RESET_PASSWORD') {
        window.location.assign(`/reset-password?email=${encodeURIComponent(email)}`);
        return;
      }
      window.location.assign(returnTo);
    } catch (err) { setError(err.message || 'サインインできませんでした。'); } finally { setLoading(false); }
  };
  return <AuthLayout icon={LogIn} title="サインイン" subtitle="メールアドレスとパスワードで、どの端末からでも制作データへアクセスできます。" footer={<>初めてですか？ <Link to={`/register${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="text-primary font-medium hover:underline">アカウントを作成</Link></>}>
    {error && <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="email">メールアドレス</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} className="h-12 pl-10" required /></div></div>
      <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">パスワード</Label><Link to={`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="text-xs text-primary hover:underline">忘れた場合</Link></div><div className="relative"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="h-12 pl-10" required /></div></div>
      <div className="flex gap-2 rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />パスワードは Suiram RPG Edit では保存せず、AWS Cognito により認証されます。</div>
      <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />サインイン中...</> : <><LogIn className="mr-2 h-4 w-4" />サインイン</>}</Button>
      <Link to="/" className="flex items-center justify-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" />ホームへ戻る</Link>
    </form>
  </AuthLayout>;
}
