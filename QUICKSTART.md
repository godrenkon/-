# Discord Web Engine - クイックスタートガイド

このガイドは、学校のパソコンなど制限されたネットワーク環境からDiscordを使用するためのセットアップ手順です。

## ⚡ 5分でスタート

### ステップ 1: Node.js のインストール

1. [Node.js 公式サイト](https://nodejs.org/) にアクセス
2. **LTS版** (最新安定版) をダウンロード
3. インストーラーを実行して、デフォルト設定でインストール

確認コマンド:
```bash
node --version
npm --version
```

### ステップ 2: リポジトリのセットアップ

```bash
# このリポジトリをダウンロード
cd /workspaces/-

# 依存パッケージをインストール
npm install
```

インストール中に以下のように表示されれば成功:
```
added 150 packages in 45s
```

### ステップ 3: Discordボットの準備

#### 3.1 ボットアプリケーションを作成

1. [Discord Developer Portal](https://discord.com/developers/applications) にログイン
   - Discord アカウントでログイン（ない場合は作成）
   
2. 「New Application」ボタンをクリック

3. ボットに名前を付ける
   - 例: `MyDiscordBot`
   - 「Create」をクリック

4. 左メニューから「Bot」を選択

5. 「Add Bot」ボタンをクリック

6. **TOKEN** セクションの「Copy」でトークンをコピー
   - ⚠️ **このトークンは絶対に他人に見せないこと!**

#### 3.2 ボットの権限を設定

Developer Portal 内で:

1. 左メニュー → 「Bot」
2. スクロールして **INTENTS** セクションまで移動
3. 以下の3つをオン ✅:
   - `Message Content Intent`
   - `Server Members Intent`  
   - `Guild Messages`

4. 「Save Changes」をクリック

#### 3.3 ボットをサーバーに招待

1. Developer Portal で「OAuth2」を選択
2. サブメニューから「URL Generator」をクリック
3. **SCOPES** で以下を選択:
   - ✅ `bot`

4. **PERMISSIONS** で以下を選択:
   - ✅ `Send Messages`
   - ✅ `Read Messages/View Channels`
   - ✅ `Read Message History`

5. 下部に生成されたURLをコピー

6. ブラウザで開き、ボットを追加するサーバーを選択

7. 「認証」をクリック

### ステップ 4: .env ファイルを設定

```bash
# .env ファイルを作成
cp .env.example .env

# ファイルを編集 (メモ帳などで)
# .env の内容:
# DISCORD_TOKEN=<ここに Step 3 でコピーしたトークンをペースト>
# PORT=3000
```

**Windows で編集:**
- エクスプローラーで `.env` ファイルを右クリック
- 「プログラムから開く」→「メモ帳」

**Mac で編集:**
- ターミナルで: `nano .env` または `vim .env`

### ステップ 5: サーバーを起動

```bash
npm start
```

成功メッセージが出ます:
```
🚀 サーバー起動: http://localhost:3000
📡 Discordボット接続中...
✓ Discordボット接続完了: YourBotName#0000
```

### ステップ 6: ブラウザで開く

ブラウザのアドレスバーに入力:
```
http://localhost:3000
```

**ボットが接続完了したら完成！** 🎉

## 🌐 別のパソコンからアクセス（学校など）

### シナリオ: 別の環境から接続したい場合

1. **自分のパソコン側:**
   ```bash
   npm start
   ```

2. **別のパソコンから:**
   - 自分のパソコンの IPアドレス を確認
   - ブラウザで: `http://192.168.x.x:3000` にアクセス
   
   *IPアドレス確認方法:*
   - Windows: コマンドプロンプトで `ipconfig`
   - Mac/Linux: ターミナルで `ifconfig`

## 🆘 よくあるエラー

### 「npm: command not found」

**解決:** Node.js がインストールされていません
```bash
# 再度インストール: https://nodejs.org/
# インストール後、ターミナルを再起動
node --version  # v16.0.0 以上が表示されれば OK
```

### 「Cannot find module 'discord.js'」

**解決:** 依存パッケージのインストール
```bash
npm install
```

### 「Error: invalid token」

**解決:** トークンが誤りまたは無効
```bash
# 1. Developer Portal で新しいトークンを生成
# 2. .env ファイルの DISCORD_TOKEN を更新
# 3. npm start で再起動
```

### 「Port 3000 is already in use」

**解決:** 別のアプリがポート3000を使用中
```bash
# 別のポートで起動
PORT=3001 npm start

# 次にブラウザで: http://localhost:3001
```

### メッセージ送信でエラー

**原因:** ボットの権限が不足
**解決:**
1. Discord サーバー設定を開く
2. 「ロール」→ ボットのロール(例: YourBotName) を選択
3. 権限を確認: メッセージ送信 ✅

## 📱 使用方法 (基本)

| アクション | 手順 |
|-----------|------|
| **サーバーを見る** | 左側のサーバー一覧をクリック |
| **チャンネルを選ぶ** | サーバーをクリックして表示されたチャンネルから選択 |
| **メッセージを送る** | 下部の入力欄に入力 → 「送信」ボタンクリック |
| **メンバーを見る** | ヘッダーの「👥 メンバー」をクリック |
| **更新する** | 左下の「🔄」ボタンをクリック |

## 🔒 セキュリティ確認リスト

- [ ] `.env` ファイルに `.gitignore` で記載されている?
- [ ] トークンを GitHub に commit してない?
- [ ] `.env` ファイルを外部サイトに貼っていない?
- [ ] トークンをスクリーンショットで共有していない?
- [ ] ボットを信頼できるサーバーだけに参加させている?

## 💻 推奨環境

| 項目 | 要件 |
|-----|------|
| OS | Windows 10/11, Mac, Linux |
| Node.js | v16以上 |
| ブラウザ | Chrome, Firefox, Safari, Edge |
| メモリ | 2GB以上 |
| インターネット | 必須 |

## 📝 トラブルシューティングフロー

```
問題が発生した
  ↓
エラーメッセージをコピーして検索
  ↓
READMEの "🆘 トラブルシューティング" を確認
  ↓
解決しない場合
  ↓
ターミナルに表示される全メッセージをコピー
  ↓
GitHub Issues で報告
```

## 🚀 次のステップ

- `server.js` を編集してカスタマイズ
- `public/app.js` でUIを変更
- 新しい機能を追加してみる

## ❓ その他の質問

### Q: トークンをリセットしたい場合は?
A: Developer Portal → Bot → TOKEN → Regenerate をクリック

### Q: 複数サーバーで使えますか?
A: はい、同じボットを複数サーバーに招待できます

### Q: 停止するには?
A: ターミナルで `Ctrl + C` を押す

### Q: ログを見たい?
A: ターミナルのコンソール出力をチェック

---

何か問題があれば GitHub Issues に報告してください！

**Happy chatting! 💬**
