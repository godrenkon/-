import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, Mail } from 'lucide-react';
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
  return <AuthLayout icon={LogIn} title="制作プロフィールを開く" subtitle="この端末で作成済みのSuiramプロフィールを選択します。" footer={<>初めてですか？ <Link to={`/register${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="text-primary font-medium hover:underline">新しく作る</Link></>}>
    {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="email">メールアドレス</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} className="pl-10 h-12" required /></div></div>
      <p className="text-xs text-muted-foreground">独立版では、メール送信・パスワード保存・外部ログインは行いません。</p>
      <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />開いています...</> : 'プロフィールを開く'}</Button>
    </form>
  </AuthLayout>;
}
