import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function Manual() {
  const { t } = useI18n();

  const sections = [
    {
      title: '1. マップエディタ (Map Editor)',
      content: [
        'マップエディタでは、ゲームの舞台となる街、ダンジョン、城、フィールドなどを描きます。',
        '【タイルパレット】画面右側に色やタイルが並んでいます。クリックして選択します。',
        '【描画ツール】鉛筆(1マスずつ配置)、四角形(範囲配置)、塗りつぶし(同色を一括変更)、消しゴム(削除)があります。',
        '【レイヤー】地面レイヤーとオブジェクトレイヤーを切り替えて配置できます。地面の上に家や木を置くなど、階層構造を作れます。',
        '【マップ設定】幅、高さ(タイル数)、タイルサイズ(px)、背景色を自由に設定できます。アップロードした画像のサイズに合わせることも可能です。',
        '【イベント配置】イベントツールを選んでマップをクリックすると、その位置にイベントを作成できます。触れると戦闘が始まる、別マップに移動する等のトリガーを設定可能。',
        '【マップ管理】左側のリストでマップを追加・削除・選択できます。マップは階層化して管理可能です。',
      ],
    },
    {
      title: '2. イベントエディタ (Event Editor)',
      content: [
        'イベントエディタでは、ゲーム内で起こる出来事(会話、アイテム入手、戦闘等)を作ります。',
        '【コマンド】「文章の表示」「選択肢の表示」「アイテムの増減」「スイッチの操作」「変数の操作」「条件分岐」「場所移動」「BGM再生」「戦闘開始」等、多数のコマンドから選んで上から順に並べます。',
        '【トリガー】決定ボタン、プレイヤー接触、自動実行、並列処理から選べます。',
        '【自律移動】固定、ランダム、近づく等の移動パターンを設定できます。',
        '【プライオリティ】プレイヤーと同じ高さ、下、上を設定できます。',
        '【イベントページ】1つのイベントに複数ページを作り、条件で切り替えられます。例: 宝箱(ページ1=閉じてる、ページ2=開いてる)。',
      ],
    },
    {
      title: '3. データベース (Database)',
      content: [
        'データベースでは、ゲームに登場するキャラクター、敵、スキル、アイテム等のデータを管理します。',
        '【アクター】主人公の名前、グラフィック、ステータス(HP/MP/攻撃力等)を設定。',
        '【職業】レベルアップ時の成長率、覚えるスキルを設定。',
        '【スキル】名前、消費MP、威力、属性、対象、ダメージ計算式を設定。計算式例: a.atk * 2 - b.def (a=使用者, b=対象)',
        '【アイテム・武器・防具】価格、効果、装備可能キャラ等を設定。',
        '【敵キャラ】HP、攻撃力、弱点、使用スキル、行動パターンを設定。',
        '【敵グループ】戦闘で出現する敵の組み合わせを設定。',
        '【ステート】毒、睡眠、麻痺等の状態異常を設定。',
        '【アニメーション】攻撃や魔法の演出を設定。',
        '【タイプ】炎、氷、雷等の属性を設定。',
        '【用語】「HP」を「体力」に変更する等、ゲーム内の用語を自由に変更可能。',
      ],
    },
    {
      title: '4. システム設定 (System)',
      content: [
        '戦闘方式(ターン制/ATB)、通貨単位、タイトル画面BGM、戦闘BGM、ゲームオーバーBGM、初期マップと初期位置を設定します。',
      ],
    },
    {
      title: '5. プラグイン (Plugins)',
      content: [
        'JavaScriptで書かれたプラグインを導入することで、システムを拡張できます。',
        'プラグイン管理画面から、公開されているプラグインを検索・導入・有効/無効の切り替えができます。',
        '自作プラグインも作成・公開可能です。詳しくは「プラグイン開発ガイド」を参照してください。',
        'プラグインは悪意のあるコードを含められないよう制限されていますが、導入前に内容を確認することを推奨します。',
      ],
    },
    {
      title: '6. AIアシスト (AI Assist)',
      content: [
        'AIに指示を入力して、イベント、マップ、スキル、ストーリーを自動生成できます。',
        '【クラウドAPI】内蔵のAIを使用。設定不要ですぐに使えます。',
        '【ローカルAI】Ollama等のローカルAIに接続可能。URL(例: http://localhost:11434)とモデル名を設定してください。',
      ],
    },
    {
      title: '7. 公開設定 (Publish)',
      content: [
        '【公開範囲】非公開(自分のみ)、限定公開(リンクを知っている人のみ)、全体公開(誰でも見れる)から選べます。',
        '【カバー画像】アップロードまたはURL指定で設定。',
        '【タグ・対応機種】RPG、アクション等のタグと、Windows/Mac/Linux/iOS/Android/Web等の対応機種を設定。',
        '【配信許可】動画や配信を許可するか設定。許可しない場合、プレイヤーは作者に許可を取る必要があります。',
      ],
    },
    {
      title: '8. 書き出し・読み込み (Export/Import)',
      content: [
        '作ったゲームを.rpgedit.jsonファイルとして書き出せます。書き出しはゲーム作成者のみ可能です。',
        '書き出したファイルをRPG editで読み込むことで、全く同じゲームを復元できます。',
        'ログインしていない場合は、ゲームの作成と書き出しのみ可能で、公開はできません。',
      ],
    },
    {
      title: '9. 素材ライブラリ (Asset Library)',
      content: [
        '画像、音声、タイルセット等の素材をアップロード・公開できます。',
        '公開した素材は誰でも自由にダウンロード・使用可能です。公開時点で「誰に自由に使われても良い」ことに同意したことになります。',
        '素材の名前、サムネイル、説明文、タグを編集できます。',
        '素材の表示は小さくなっており、一度に多くの素材を確認できます。',
      ],
    },
    {
      title: '10. アカウント・共有 (Account & Sharing)',
      content: [
        'アカウント画面でプロフィール、表示名、自己紹介、アバター、言語設定を変更できます。',
        'チーム機能で他のユーザーと共同編集、チーム内限定素材の共有ができます。',
        'DM機能で他のユーザーとメッセージを送受信できます。',
        'アカウントごとにデータは完全に分離されており、他のアカウントのデータにアクセスすることはできません。',
      ],
    },
    {
      title: '11. 数字入力について (Number Input Guide)',
      content: [
        'ステータスやダメージ計算式など、数字を入力する場所では以下の方法が使えます:',
        '・固定値: そのまま数字を入力 (例: 100)',
        '・計算式: 四則演算が可能 (例: 50 + 30, 100 * 2)',
        '・ランダム: rand(n) で0〜n-1の乱数 (例: rand(100) で0〜99)',
        '・範囲ランダム: rand(min, max) でmin〜maxの乱数 (例: rand(50, 100) で50〜100)',
        '・変数参照: 変数名で参照 (例: lv * 10 でレベルの10倍)',
        '・ダメージ計算式: a.atk(使用者攻撃力), b.def(対象防御力)等 (例: a.atk * 2 - b.def / 2)',
      ],
    },
  ];

  const downloadManual = () => {
    let text = 'RPG edit 機能説明書\n' + '='.repeat(40) + '\n\n';
    sections.forEach(s => {
      text += s.title + '\n' + '-'.repeat(s.title.length) + '\n';
      s.content.forEach(c => { text += '  ' + c + '\n'; });
      text += '\n';
    });
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rpgedit_manual.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('manual_title')}</h1>
        <Button onClick={downloadManual} variant="outline" className="border-zinc-700">
          <Download size={16} className="mr-1" /> {t('manual_download')}
        </Button>
      </div>
      <p className="text-sm text-zinc-500 mb-8">{t('manual_intro')}</p>

      <div className="space-y-6">
        {sections.map((s, i) => (
          <div key={i} className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 p-5">
            <h2 className="text-base font-semibold text-zinc-200 mb-3">{s.title}</h2>
            <ul className="space-y-1.5">
              {s.content.map((c, j) => (
                <li key={j} className="text-sm text-zinc-400 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-zinc-600">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}