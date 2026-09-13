import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';

export default function ResetPassword() {
  const [params] = useSearchParams(); const [email, setEmail] = useState(params.get('email') || ''); const [code, setCode] = useState(''); const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [loading, setLoading] = useState(false);
  const requestCode = async event => {
    event.preventDefault(); setError(''); setNotice(''); setLoading(true);
    try { await rpgStore.auth.requestPasswordReset(email); setSent(true); setNotice('再設定コードをメールに送信しました。'); }
    catch (err) { setError(err.message || '再設定コードを送信できませんでした。'); } finally { setLoading(false); }
  };
  const reset = async event => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await rpgStore.auth.confirmPasswordReset({ email, code, password }); window.location.assign('/login'); }
    catch (err) { setError(err.message || 'パスワードを更新できませんでした。'); } finally { setLoading(false); }
  };
  return <AuthLayout icon={KeyRound} title="パスワードを再設定" subtitle={sent ? 'メールに届いたコードと新しいパスワードを入力してください。' : '登録メールアドレスへ再設定コードを送ります。'} footer={<Link to="/login" className="text-primary font-medium hover:underline">サインインへ戻る</Link>}>
    {error && <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    {notice && <div role="status" className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</div>}
    {!sent ? <form onSubmit={requestCode} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">メールアドレス</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" autoFocus value={email} onChange={event => setEmail(event.target.value)} className="h-12 pl-10" required /></div></div><Button type="submit" className="h-12 w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '再設定コードを送る'}</Button><Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />サインインへ戻る</Link></form> : <form onSubmit={reset} className="space-y-4"><div className="space-y-2"><Label htmlFor="code">再設定コード</Label><Input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="h-12 text-center text-lg tracking-[0.35em]" required /></div><div className="space-y-2"><Label htmlFor="password">新しいパスワード</Label><Input id="password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="h-12" minLength={8} required /></div><div className="flex gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />8文字以上で設定してください。</div><Button type="submit" className="h-12 w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />更新中...</> : '新しいパスワードに更新'}</Button></form>}
  </AuthLayout>;
}
