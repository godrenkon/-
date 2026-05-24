FROM node:18-alpine

WORKDIR /app

# 依存パッケージのコピーと インストール
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションコードのコピー
COPY . .

# ポート3000を公開
EXPOSE 3000

# ボットトークンの環境変数
ENV NODE_ENV=production

# サーバー起動
CMD ["node", "server.js"]
