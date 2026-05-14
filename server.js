const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const { Client, GatewayIntentBits, ChannelType, EmbedBuilder } = require('discord.js');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Discordボット初期化
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ボット状態管理
let botReady = false;
let connectedUsers = new Map();

// Discord ボット イベント
client.once('ready', () => {
  console.log(`✓ Discordボット接続完了: ${client.user.tag}`);
  botReady = true;
  io.emit('bot-status', { ready: true, user: client.user.username });
});

client.on('error', error => {
  console.error('Discord Bot Error:', error);
  io.emit('bot-error', { error: error.message });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  // ウェブUIに新しいメッセージを通知
  io.emit('new-message', {
    username: message.author.username,
    content: message.content,
    channel: message.channel.name || 'DM',
    timestamp: message.createdTimestamp,
    avatar: message.author.displayAvatarURL()
  });
});

// Socket.IO イベント
io.on('connection', (socket) => {
  console.log(`ユーザー接続: ${socket.id}`);
  
  socket.emit('connection-success', { id: socket.id });
  
  // ボットの状態を送信
  socket.emit('bot-status', { ready: botReady, user: botReady ? client.user.username : 'Not Connected' });

  // サーバー一覧取得
  socket.on('get-guilds', () => {
    if (!botReady) {
      socket.emit('error', { message: 'ボットが接続されていません' });
      return;
    }

    const guilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      memberCount: guild.memberCount
    }));

    socket.emit('guilds-list', { guilds });
  });

  // サーバーのチャンネル一覧取得
  socket.on('get-channels', (data) => {
    try {
      const guild = client.guilds.cache.get(data.guildId);
      if (!guild) {
        socket.emit('error', { message: 'サーバーが見つかりません' });
        return;
      }

      const channels = guild.channels.cache
        .filter(channel => channel.type === ChannelType.GuildText)
        .map(channel => ({
          id: channel.id,
          name: channel.name,
          topic: channel.topic || ''
        }));

      socket.emit('channels-list', { channels, guildName: guild.name });
    } catch (error) {
      console.error('チャンネル取得エラー:', error);
      socket.emit('error', { message: 'チャンネル取得に失敗しました' });
    }
  });

  // メッセージ送信
  socket.on('send-message', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel) {
        socket.emit('error', { message: 'チャンネルが見つかりません' });
        return;
      }

      const message = await channel.send(data.content);
      socket.emit('message-sent', { 
        success: true, 
        messageId: message.id,
        content: message.content,
        timestamp: message.createdTimestamp
      });
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      socket.emit('error', { message: 'メッセージ送信に失敗しました: ' + error.message });
    }
  });

  // 過去のメッセージ取得
  socket.on('get-messages', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel) {
        socket.emit('error', { message: 'チャンネルが見つかりません' });
        return;
      }

      const messages = await channel.messages.fetch({ limit: 50 });
      const messageList = messages
        .reverse()
        .map(msg => ({
          id: msg.id,
          author: msg.author.username,
          avatar: msg.author.displayAvatarURL(),
          content: msg.content,
          timestamp: msg.createdTimestamp,
          embeds: msg.embeds
        }));

      socket.emit('messages-list', { messages: messageList });
    } catch (error) {
      console.error('メッセージ取得エラー:', error);
      socket.emit('error', { message: 'メッセージ取得に失敗しました' });
    }
  });

  // メンバー一覧取得
  socket.on('get-members', async (data) => {
    try {
      const guild = client.guilds.cache.get(data.guildId);
      if (!guild) {
        socket.emit('error', { message: 'サーバーが見つかりません' });
        return;
      }

      await guild.members.fetch();
      const members = guild.members.cache.map(member => ({
        id: member.user.id,
        username: member.user.username,
        avatar: member.user.displayAvatarURL(),
        status: member.presence?.status || 'offline',
        roles: member.roles.cache.map(role => role.name)
      }));

      socket.emit('members-list', { members });
    } catch (error) {
      console.error('メンバー取得エラー:', error);
      socket.emit('error', { message: 'メンバー取得に失敗しました' });
    }
  });

  // リアクション追加
  socket.on('add-reaction', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      const message = await channel.messages.fetch(data.messageId);
      await message.react(data.emoji);
      socket.emit('reaction-added', { success: true });
    } catch (error) {
      console.error('リアクション追加エラー:', error);
      socket.emit('error', { message: 'リアクション追加に失敗しました' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`ユーザー切断: ${socket.id}`);
    connectedUsers.delete(socket.id);
  });
});

// REST API エンドポイント
app.get('/api/status', (req, res) => {
  res.json({
    botReady,
    botUser: botReady ? client.user.username : null,
    connectedUsers: io.engine.clientsCount
  });
});

app.get('/api/guilds', (req, res) => {
  if (!botReady) {
    return res.status(400).json({ error: 'ボットが接続されていません' });
  }

  const guilds = client.guilds.cache.map(guild => ({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL(),
    memberCount: guild.memberCount
  }));

  res.json({ guilds });
});

// ルートページ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error('❌ エラー: .env ファイルに DISCORD_TOKEN を設定してください');
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
  console.log('📡 Discordボット接続中...');
  client.login(TOKEN).catch(error => {
    console.error('❌ ボット接続エラー:', error);
  });
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
  console.log('\nシャットダウン中...');
  client.destroy();
  server.close(() => {
    console.log('✓ サーバー停止');
    process.exit(0);
  });
});
