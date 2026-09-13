import { Link, useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const pageName = useLocation().pathname;
  return <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50"><div className="max-w-md text-center space-y-5"><h1 className="text-7xl font-light text-slate-300">404</h1><h2 className="text-2xl font-medium text-slate-800">ページが見つかりません</h2><p className="text-slate-600">{pageName} はSuiram RPG Editにはありません。</p><Link to="/" className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">ホームへ戻る</Link></div></div>;
}
