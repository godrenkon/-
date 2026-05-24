# Discord Web Engine 🚀

学校のネットワークなど制限されたネットワーク環境で、ブラウザを使用してDiscordを操作できるWebエンジンです。

## 📋 特徴

- ✅ **ブラウザベース**: 特別なソフトウェアのインストール不要
- ✅ **Discord.js対応**: 公式APIを使用した安定した動作
- ✅ **リアルタイム通信**: Socket.IOでリアルタイムメッセージ更新
- ✅ **シンプルなUI**: Discordクライアントに似たインターフェース
- ✅ **サーバーアクセス制限なし**: 学校のネットワークからアクセス可能

## 🚀 インストール & 実行

### 前提条件

- **Node.js** (v16以上) をインストール: [nodejs.org](https://nodejs.org/)
- **Discordボットトークン**: 下記を参照

### 1. ディレクトリの設定

```bash
# リポジトリをクローン
git clone https://github.com/godrenkon/-.git
cd discord-web-engine

# 依存パッケージのインストール
npm install
```

### 2. Discordボットの作成

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリック
3. ボットに名前を付ける（例: "Discord Web Engine"）
4. 「Bot」タブから「Add Bot」をクリック
5. 「TOKEN」の下にある「Copy」でトークンをコピー
6. **下のIntentsセクションで以下を有効化:**
   - ✅ Message Content Intent
   - ✅ Server Members Intent
   - ✅ Guild Messages

### 3. ボットをサーバーに招待

1. Developer Portalで「OAuth2」→「URL Generator」をクリック
2. **Scopes** で以下を選択:
   - ✅ bot
   - ✅ applications.commands

3. **Permissions** で以下を選択:
   - ✅ Send Messages
   - ✅ Read Messages
   - ✅ Manage Messages
   - ✅ Read Message History

4. 生成されたURLをコピーしてブラウザで開く
5. ボットを追加するサーバーを選択

### 4. 環境変数の設定

```bash
# .env ファイルを作成
cp .env.example .env

# .env ファイルを編集してトークンを入力
# 内容:
# DISCORD_TOKEN=your_bot_token_here
# PORT=3000
```

### 5. サーバー起動

```bash
npm start
```

起動すると:
```
🚀 サーバー起動: http://localhost:3000
📡 Discordボット接続中...
✓ Discordボット接続完了: YourBotName#0000
```

## 🌐 ブラウザでアクセス

ブラウザを開いて以下のアドレスにアクセス:

```
http://localhost:3000
```

**学校のネットワークからアクセスする場合:**
- 自分のパソコンにNode.jsをインストール
- サーバーを起動
- 同じネットワーク内の別の環境から `http://あなたのIPアドレス:3000` でアクセス

## 💬 使い方

### 基本的な操作

1. **サーバーを選択**: 左サイドバーのサーバーをクリック
2. **チャンネルを選択**: 表示されたチャンネル一覧から選択
3. **メッセージを読む**: 過去50件のメッセージが表示されます
4. **メッセージを送信**: 下部の入力欄にメッセージを入力して「送信」ボタンをクリック
5. **メンバーを確認**: チャンネルヘッダーの「👥 メンバー」をクリック
6. **更新**: 🔄 ボタンで最新の情報を取得

### ボタン説明

| ボタン | 説明 |
|--------|------|
| 🔄 | サーバーとメッセージを更新 |
| ⚙️ | 設定（トークン管理） |
| 👥 | メンバー一覧を表示 |
| ✕ | メンバーパネルを閉じる |

## 🔒 セキュリティについて

### ⚠️ 重要な注意事項

1. **トークンの取り扱い**
   - トークンはパスワードと同じです
   - 他人に教えないでください
   - 誤ってGitHubにコミットしないよう注意

2. **ローカルでの実行を推奨**
   - このアプリケーションは個人用途を想定しています
   - 信頼できるネットワーク環境での使用を推奨

3. **学校のポリシーを確認**
   - 学校のコンピューターで使用する前に、管理者に許可を得てください
   - 学校のネットワークポリシーに違反していないか確認してください

## 📦 ディレクトリ構成

```
.
├── server.js              # メインサーバーファイル
├── package.json           # 依存関係とスクリプト
├── .env.example           # 環境変数のテンプレート
├── .env                   # 環境変数（作成が必要）
├── README.md              # このファイル
└── public/
    ├── index.html         # メインHTMLファイル
    ├── style.css          # スタイルシート
    └── app.js             # フロントエンドロジック
```

## 🆘 トラブルシューティング

### Q: ボットが接続されない

**A:** 以下を確認してください:
```bash
# 1. .env ファイルが存在し、トークンが正しく設定されているか
cat .env

# 2. ボットがサーバーに参加しているか
# Discord Developer Portal で確認

# 3. Intents が有効化されているか
# Developer Portal -> Bot -> Intents で確認
```

### Q: "メッセージ送信に失敗しました" と表示される

**A:** 
- ボットの権限を確認してください
- サーバー設定でボットに権限を付与してください
- チャンネルの権限設定でボットがメッセージ送信を許可されているか確認

### Q: ブラウザからアクセスできない

**A:**
```bash
# 1. サーバーが起動しているか確認
# コンソールに "🚀 サーバー起動" が表示されているか確認

# 2. ファイアウォールを確認
# Windows: コントロールパネル → Windows Defender ファイアウォール
# Mac: システム設定 → セキュリティとプライバシー

# 3. ポート番号が変わっていないか
# npm start の出力を確認
```

### Q: "トークンが無効です" というエラーが出る

**A:**
```bash
# 1. 新しいトークンを生成
# Developer Portal -> Bot -> TOKEN -> Regenerate

# 2. .env ファイルに新しいトークンをコピペ

# 3. npm start で再起動
```

## 📱 対応ブラウザ

- ✅ Google Chrome / Chromium
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Safari
- ✅ その他のモダンブラウザ

## 🔧 開発者向け

### 開発モード (自動リロード)

```bash
npm install -D nodemon  # 既にインストール済み
npm run dev
```

### APIエンドポイント

```
GET  /api/status      - ボットの状態確認
GET  /api/guilds      - サーバー一覧取得
```

### Socket.IOイベント

| イベント | 説明 |
|---------|------|
| `get-guilds` | サーバー一覧を取得 |
| `get-channels` | チャンネル一覧を取得 |
| `get-messages` | メッセージを取得 |
| `send-message` | メッセージを送信 |
| `get-members` | メンバー一覧を取得 |

## 📝 使用技術

- **バックエンド**
  - Node.js + Express
  - Discord.js (Discordボット)
  - Socket.IO (リアルタイム通信)

- **フロントエンド**
  - HTML5
  - CSS3
  - Vanilla JavaScript

- **ホスティング**
  - ローカルマシン
  - Heroku (オプション)
  - Glitch (オプション)

## 🌩️ クラウドでのデプロイ

### GitHub Codespaces でのテスト

```bash
# GitHub Codespaces で開く

# 依存パッケージのインストール
npm install

# .env ファイルを作成してトークンを設定
echo "DISCORD_TOKEN=your_token_here" > .env

# サーバー起動
npm start
```

## 📧 ライセンス

MIT License - 自由に使用・改変できます

## ⚡ パフォーマンス最適化

大量のサーバー/チャンネルを使用する場合:

1. **メッセージキャッシュの設定**
   - `server.js` の `client.options.messageCacheLifetime` を調整

2. **スクロール最適化**
   - メッセージ表示数をlimitで制限（デフォルト: 50件）

3. **メモリ使用量の監視**
   - `process.memoryUsage()` でメモリ状況を確認

## 🚀 今後の更新予定

- [ ] ダイレクトメッセージ対応
- [ ] ファイルアップロード対応
- [ ] 絵文字リアクション拡張
- [ ] 音声チャンネル情報表示
- [ ] ダークモード/ライトモード切り替え
- [ ] メッセージ検索機能
- [ ] モバイルアプリ化

## 💡 ヒント

- 学校のWi-Fiの速度が遅い場合は、データセーバーモードでメッセージ数を削減
- トークンは絶対に他の人に見せないようにしましょう
- 定期的に `.env` ファイルをバックアップしてください
- GitHub Codespaces は無料時間に制限があります

## 🤝 貢献

改善案やバグ報告は GitHub Issues で！

---

**製作者**: GitHub Copilot  
**最終更新**: 2026年5月14日

### よくある質問

**Q: 複数の人が同時に使えますか？**  
A: はい、複数デバイスから同時アクセス可能です。Socket.IOでリアルタイム同期しています。

**Q: メッセージ履歴は保存されますか？**  
A: いいえ、アプリを再起動するとメッセージ履歴はリセットされます。実際のメッセージはDiscord上に保存されています。

**Q: インターネット接続が必要ですか？**  
A: はい、Discordサーバーに接続する必要があるため、インターネット接続が必須です。

**Q: ボットをカスタマイズできますか？**  
A: はい、`server.js` を編集することでカスタマイズ可能です。

---

楽しいDiscordライフを！🎉