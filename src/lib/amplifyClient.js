import { Amplify } from 'aws-amplify';

let setupPromise;

export const configureSuiramCloud = () => {
  if (setupPromise) return setupPromise;
  setupPromise = fetch('/amplify_outputs.json', { cache: 'no-store' })
    .then(async response => {
      if (!response.ok) throw new Error('クラウドアカウントの設定を読み込めませんでした。時間をおいて再試行してください。');
      const outputs = await response.json();
      Amplify.configure(outputs);
    })
    .catch(error => {
      setupPromise = undefined;
      throw error;
    });
  return setupPromise;
};
