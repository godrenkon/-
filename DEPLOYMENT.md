# デプロイガイド - Discord Web Engine

このファイルは、Discord Web Engine を様々なプラットフォームにデプロイする方法を説明します。

## 📌 ローカルでの実行（最も簡単）

```bash
npm install
cp .env.example .env
# .env にトークンを設定
npm start
```

## 🐳 Docker でのデプロイ

### Docker のインストール

- [Docker Desktop](https://www.docker.com/products/docker-desktop) をダウンロードしてインストール

### Docker で実行

```bash
# イメージのビルド
docker build -t discord-web-engine:latest .

# コンテナの起動
docker run -e DISCORD_TOKEN=your_token_here -p 3000:3000 discord-web-engine:latest
```

### Docker Compose で実行

```bash
# .env ファイルを設定
cp .env.example .env
# DISCORD_TOKEN を設定

# 起動
docker-compose up -d

# ログを確認
docker-compose logs -f

# 停止
docker-compose down
```

## ☁️ クラウドサービスでのデプロイ

### Heroku でのデプロイ（無料）

```bash
# Heroku CLI のインストール
# https://devcenter.heroku.com/articles/heroku-cli

# ログイン
heroku login

# アプリの作成
heroku create your-app-name

# 環境変数の設定
heroku config:set DISCORD_TOKEN=your_token_here

# デプロイ
git push heroku main

# ログを確認
heroku logs --tail
```

**Procfile** が必要（すでに準備済み）:
```
web: node server.js
```

### Railway でのデプロイ

1. [Railway.app](https://railway.app/) にアクセス
2. GitHub アカウントでログイン
3. このリポジトリをコネクト
4. 環境変数 `DISCORD_TOKEN` を設定
5. 自動デプロイ開始

### Render でのデプロイ

1. [Render.com](https://render.com/) にアクセス
2. 「New +」から「Web Service」を選択
3. GitHub リポジトリを接続
4. 設定:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. 環境変数 `DISCORD_TOKEN` を設定

### Glitch でのデプロイ

1. [Glitch.com](https://glitch.com/) にアクセス
2. 「New Project」から「Clone from Git Repo」
3. このリポジトリのURLを入力
4. `.env` ファイルに `DISCORD_TOKEN` を設定
5. 自動実行開始

## 🚀 AWS でのデプロイ

### AWS EC2 での実行

```bash
# EC2 インスタンスに接続

# Node.js インストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# リポジトリクローン
git clone https://github.com/godrenkon/-.git
cd discord-web-engine

# 依存パッケージインストール
npm install

# 環境変数設定
echo "DISCORD_TOKEN=your_token" > .env

# PM2 で永続実行
sudo npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save

# セキュリティグループ設定
# ポート 3000 をインバウンドで許可
```

### AWS Lambda でのデプロイ

```bash
# Serverless Framework をインストール
npm install -g serverless

# Lambda 用に serverless.yml を設定
# Express アプリを Lambda に適応させる必要あり
```

## 🐧 Linux/VPS でのデプロイ

### Ubuntu/Debian サーバー

```bash
# SSH でサーバーに接続

# Node.js インストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs npm git

# プロジェクトクローン
cd /home/username
git clone https://github.com/godrenkon/-.git
cd discord-web-engine

# 依存パッケージインストール
npm install

# 環境変数設定
cat > .env << EOF
DISCORD_TOKEN=your_token_here
PORT=3000
EOF

# PM2 で実行
sudo npm install -g pm2
pm2 start server.js --name "discord-web"
pm2 startup
pm2 save
```

### Nginx リバースプロキシ設定

```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 セキュリティ設定

### HTTPS の設定（Let's Encrypt）

```bash
sudo apt-get install -y certbot python3-certbot-nginx

# 証明書の取得
sudo certbot certonly --standalone -d your_domain.com

# Nginx で HTTPS を有効化
```

### ファイアウォール設定

```bash
# UFW でファイアウォール設定
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 📊 モニタリング

### PM2 モニタリング

```bash
pm2 monit         # リアルタイム監視
pm2 logs          # ログ表示
pm2 status        # ステータス確認
```

### サーバーメトリクス確認

```bash
# CPU/メモリ使用率
top
free -h
df -h

# ネットワーク確認
netstat -tuln
```

## 🔄 CI/CD パイプライン

GitHub Actions で自動テストとデプロイ:

```yaml
# .github/workflows/deploy.yml 内で設定可能
```

## 📱 レスポンシブサイト化

モバイルからのアクセス対応状況:
- ✅ レスポンシブデザイン対応
- ✅ タッチ操作対応
- ✅ ダークモード対応

## 🆘 デプロイ時のトラブル

### ポート番号 3000 が使用中

```bash
# 別のプロセスをキル
lsof -i :3000
kill -9 <PID>

# または別のポートで起動
PORT=8080 npm start
```

### メモリ不足エラー

```bash
# Node のメモリ制限を増やす
node --max-old-space-size=4096 server.js
```

### タイムアウトエラー

環境変数を設定:
```bash
NODE_TIMEOUT=60000
```

## 📈 スケーリング

複数インスタンスで実行:

```bash
# Cluster モード（PM2）
pm2 start server.js -i max   # CPU コア数分起動
```

## ✅ デプロイチェックリスト

デプロイ前に確認:

- [ ] `.env` ファイルに `DISCORD_TOKEN` が設定されているか
- [ ] `node_modules/` が `.gitignore` に含まれているか
- [ ] トークンが公開リポジトリにコミットされていないか
- [ ] ファイアウォール設定は完了しているか
- [ ] HTTPS 設定が有効化されているか（推奨）
- [ ] ログ出力ディレクトリは存在するか
- [ ] ディスク容量は十分か
- [ ] メモリは十分か（最小 512MB 推奨）

## 📞 サポート

デプロイに問題がある場合:
1. ログを確認: `logs/` ディレクトリ
2. エラーメッセージをコピー
3. GitHub Issues で報告

---

Happy deploying! 🚀
