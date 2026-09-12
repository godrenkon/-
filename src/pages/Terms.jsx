import React from 'react';
import { useI18n } from '@/lib/i18n';

export default function Terms() {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('terms_title')}</h1>
      <p className="text-sm text-zinc-500 mb-8">{t('terms_updated')}</p>

      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 mb-6">
        <p className="text-sm text-zinc-400 leading-relaxed">{t('terms_intro')}</p>
      </div>

      <div className="space-y-6">
        <Section title={t('terms_section1')} body={t('terms_section1_body')} />
        <Section title={t('terms_section2')} body={t('terms_section2_body')} />
        <Section title={t('terms_section3')} body={t('terms_section3_body')} />
        <Section title={t('terms_section4')} body={t('terms_section4_body')} />
        <Section title={t('terms_section5')} body={t('terms_section5_body')} />
        <Section title={t('terms_section6')} body={t('terms_section6_body')} />
      </div>
    </div>
  );
}

function Section({ title, body }) {
  return (
    <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 p-5">
      <h2 className="text-base font-semibold text-zinc-200 mb-2">{title}</h2>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}