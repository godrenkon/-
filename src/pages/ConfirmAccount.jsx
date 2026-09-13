import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, BadgeCheck, Loader2, Mail, RefreshCw } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';

export default function ConfirmAccount() {
  const [params] = useSearchParams(); const [email, setEmail] = useState(params.get('email') || ''); const [code, setCode] = useState('');
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [loading, setLoading] = useState(false);
  const returnTo = params.get('returnTo') || '/';
  const confirm = async event => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await rpgStore.auth.verifyOtp({ email, code }); window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`); }
    catch (err) { setError(err.message || '確認コードを確認できませんでした。'); } finally { setLoading(false); }
  };
  const resend = async () => {
    setError(''); setNotice(''); setLoading(true);
    try { await rpgStore.auth.resendOtp({ email }); setNotice('確認コードを再送しました。メールをご確認ください。'); }
    catch (err) { setError(err.message || '確認コードを再送できませんでした。'); } finally { setLoading(false); }
  };
  return <AuthLayout icon={BadgeCheck} title="メールアドレスを確認" subtitle="届いた確認コードを入力すると、アカウントを有効化できます。" footer={<>メールアドレスを間違えた場合は <Link to="/register" className="text-primary font-medium hover:underline">作り直す</Link></>}>
    {error && <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    {notice && <div role="status" className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</div>}
    <form onSubmit={confirm} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="email">メールアドレス</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="h-12 pl-10" required /></div></div>
      <div className="space-y-2"><Label htmlFor="code">確認コード</Label><Input id="code" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="h-12 text-center text-lg tracking-[0.35em]" required /></div>
      <Button type="submit" className="h-12 w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />確認中...</> : <><BadgeCheck className="mr-2 h-4 w-4" />確認してサインインへ</>}</Button>
      <Button type="button" variant="outline" className="h-11 w-full" onClick={resend} disabled={!email || loading}><RefreshCw className="mr-2 h-4 w-4" />確認コードを再送</Button>
      <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />サインインへ戻る</Link>
    </form>
  </AuthLayout>;
}
