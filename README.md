# Suiram RPG Edit

Suiram Community が開発する、ブラウザで動く独立型RPG制作ソフトです。タイルマップ、イベント、データベース、戦闘、公式拡張、テストプレイ、JSON入出力をひとつの制作環境にまとめています。

## 独立版の設計

- 外部の認証・データベース・ビルダーサービスには依存しません。
- ゲーム、素材、公式拡張の有効状態、制作プロフィールは、使用中のブラウザに保存されます。
- 素材アップロードはデータURLとして端末内に保存されます（1ファイル3MBまで）。
- AIアシストは、利用者が設定したカスタムAPIまたはローカルAIだけを使用します。APIキーはこのブラウザにのみ保存されます。

ブラウザデータの消去、別の端末、シークレットウィンドウでは制作データは引き継がれません。大切な作品は、ダッシュボードから定期的にJSON書き出ししてください。

## 開発

```bash
npm ci
npm run dev
```

`http://localhost:5173` を開きます。

## 検証

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Amplify 配信

`main` ブランチを Amplify アプリ **RPG-Edit**（`d1x27dyfczqt8n`）へ接続すると、リポジトリへの更新で自動ビルド・配信されます。追加の環境変数は不要です。`amplify.yml` はテスト、Lint、型検査、ビルドを実行して `dist/` を公開します。

## ライセンスとブランド

Product name: Suiram RPG Edit

Publisher: Suiram Community
Repository: https://github.com/godrenkon/RPG_Edit
