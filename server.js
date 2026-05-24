const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const prism = require('prism-media');
const { Client, GatewayIntentBits, ChannelType, EmbedBuilder, PermissionFlagsBits, Partials } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');

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

// キャッシュ制御: HTML/CSS/JS が常に最新版を読み込む
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Discordボット初期化
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ボット状態管理
let botReady = false;
let connectedUsers = new Map();
const voiceConnections = new Map();

// Discord ボット イベント
let clientReadyHandled = false;
const handleClientReady = () => {
  if (clientReadyHandled) return;
  clientReadyHandled = true;
  console.log(`✓ Discordボット接続完了: ${client.user.tag}`);
  botReady = true;
  io.emit('bot-status', { ready: true, user: client.user.username });
};

client.once('clientReady', handleClientReady);

client.on('error', error => {
  console.error('Discord Bot Error:', error);
  io.emit('bot-error', { error: error.message });
});

client.on('voiceStateUpdate', (oldState, newState) => {
  if (!oldState?.member || !newState?.member) return;
  if (!oldState.member.user.bot && !newState.member.user.bot) return;
  console.log(`voiceStateUpdate: ${oldState.member.user.tag} ${oldState.channelId || 'none'} -> ${newState.channelId || 'none'}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const attachments = message.attachments.map(att => ({
    id: att.id,
    name: att.name,
    url: att.url,
    contentType: att.contentType,
    width: att.width,
    height: att.height,
    size: att.size
  }));

  io.emit('new-message', {
    channelId: message.channel.id,
    channel: message.channel.name || 'DM',
    author: message.author.username,
    authorId: message.author.id,
    authorTag: message.author.tag,
    avatar: message.author.displayAvatarURL(),
    content: message.content,
    timestamp: message.createdTimestamp,
    attachments
  });
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (newMessage.partial) {
    try {
      newMessage = await newMessage.fetch();
    } catch {
      return;
    }
  }
  if (!newMessage || newMessage.author?.bot) return;
  io.emit('message-updated', serializeMessage(newMessage));
});

client.on('messageDelete', async (message) => {
  const channelId = message.channel?.id || message.channelId;
  if (!message || !message.id || !channelId) return;
  io.emit('message-deleted', { messageId: message.id, channelId });
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      return;
    }
  }
  const message = reaction.message;
  if (!message) return;
  io.emit('reaction-updated', {
    channelId: message.channel.id,
    messageId: message.id,
    emoji: reaction.emoji.name,
    count: reaction.count,
    me: reaction.me
  });
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      return;
    }
  }
  const message = reaction.message;
  if (!message) return;
  io.emit('reaction-updated', {
    channelId: message.channel.id,
    messageId: message.id,
    emoji: reaction.emoji.name,
    count: reaction.count,
    me: reaction.me
  });
});

function serializeEmbed(embed) {
  return {
    title: embed.title || null,
    description: embed.description || null,
    url: embed.url || null,
    type: embed.type || null,
    image: embed.image?.url || null,
    thumbnail: embed.thumbnail?.url || null,
    video: embed.video?.url || null,
    provider: embed.provider?.name || null,
    author: embed.author?.name || null,
    fields: embed.fields?.map(field => ({
      name: field.name,
      value: field.value,
      inline: field.inline
    })) || []
  };
}

function serializeMessage(msg) {
  const replyReference = msg.reference;
  return {
    id: msg.id,
    channelId: msg.channel.id,
    author: msg.author.username,
    authorId: msg.author.id,
    authorTag: msg.author.tag,
    avatar: msg.author.displayAvatarURL(),
    content: msg.content,
    timestamp: msg.createdTimestamp,
    attachments: msg.attachments.map(att => ({
      id: att.id,
      name: att.name,
      url: att.url || att.proxyURL || att.previewURL,
      contentType: att.contentType,
      size: att.size,
      height: att.height,
      width: att.width
    })),
    embeds: msg.embeds.map(serializeEmbed),
    mentions: msg.mentions.users.map(user => ({
      id: user.id,
      username: user.username,
      tag: user.tag
    })),
    reactions: msg.reactions.cache.map(reaction => ({
      id: reaction.emoji.id || reaction.emoji.name,
      emoji: reaction.emoji.name,
      count: reaction.count,
      me: reaction.me
    })),
    replyTo: replyReference ? {
      messageId: replyReference.messageId,
      channelId: replyReference.channelId,
      authorId: msg.mentions.repliedUser?.id || null,
      author: msg.mentions.repliedUser?.username || null,
      jumpUrl: msg.reference?.messageId ? msg.url : null
    } : null,
    canEdit: msg.author.id === client.user.id,
    canDelete: msg.author.id === client.user.id || msg.channel.permissionsFor(client.user)?.has(PermissionFlagsBits.ManageMessages)
  };
}

async function fetchChannelMessages(channel, limit = 100, before = null, fetchAll = false) {
  const normalizedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 10000);
  let messages = [];
  let currentBefore = before || null;
  let hasMore = false;

  if (fetchAll) {
    while (messages.length < normalizedLimit) {
      const fetchLimit = Math.min(100, normalizedLimit - messages.length);
      const options = { limit: fetchLimit };
      if (currentBefore) options.before = currentBefore;

      const batch = await channel.messages.fetch(options);
      if (!batch.size) break;

      const batchMessages = batch.reverse().map(serializeMessage);
      messages = batchMessages.concat(messages);
      currentBefore = batchMessages[0].id;
      hasMore = batch.size === fetchLimit;

      if (batch.size < fetchLimit) break;
    }
  } else {
    const options = { limit: Math.min(normalizedLimit, 100) };
    if (currentBefore) options.before = currentBefore;
    const batch = await channel.messages.fetch(options);
    messages = batch.reverse().map(serializeMessage);
    hasMore = batch.size === options.limit;
  }

  return {
    messages,
    oldestMessageId: messages.length > 0 ? messages[0].id : null,
    hasMore
  };
}

// Socket.IO イベント
io.on('connection', (socket) => {
  console.log(`ユーザー接続: ${socket.id}`);
  
  socket.emit('connection-success', { id: socket.id });
  
  // ボットの状態を送信
  socket.emit('bot-status', { ready: botReady, user: botReady ? client.user.username : 'Not Connected' });

  // サーバー一覧取得
  socket.on('get-guilds', () => {
    if (!botReady) {
      socket.emit('app-error', { message: 'ボットが接続されていません' });
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
        socket.emit('app-error', { message: 'サーバーが見つかりません' });
        return;
      }

      const channels = guild.channels.cache
        .filter(channel => [ChannelType.GuildText, ChannelType.GuildVoice].includes(channel.type))
        .sort((a, b) => a.position - b.position)
        .map(channel => ({
          id: channel.id,
          name: channel.name,
          topic: channel.topic || '',
          type: channel.type
        }));

      socket.emit('channels-list', { channels, guildName: guild.name });
    } catch (error) {
      console.error('チャンネル取得エラー:', error);
      socket.emit('app-error', { message: 'チャンネル取得に失敗しました' });
    }
  });

  // メッセージ送信
  socket.on('send-message', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel) {
        socket.emit('app-error', { message: 'チャンネルが見つかりません' });
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
      socket.emit('app-error', { message: 'メッセージ送信に失敗しました: ' + error.message });
    }
  });

  // 過去のメッセージ取得
  socket.on('get-messages', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel) {
        socket.emit('app-error', { message: 'チャンネルが見つかりません' });
        return;
      }

      const result = await fetchChannelMessages(channel, data.limit || 100, data.before || null, data.fetchAll === true);
      socket.emit('messages-list', result);
    } catch (error) {
      console.error('メッセージ取得エラー:', error);
      socket.emit('app-error', { message: 'メッセージ取得に失敗しました' });
    }
  });

  socket.on('get-more-messages', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel) {
        socket.emit('app-error', { message: 'チャンネルが見つかりません' });
        return;
      }

      const result = await fetchChannelMessages(channel, data.limit || 100, data.before || null, false);
      socket.emit('more-messages-list', result);
    } catch (error) {
      console.error('過去メッセージ取得エラー:', error);
      socket.emit('app-error', { message: '過去メッセージの取得に失敗しました' });
    }
  });

  // メンバー一覧取得
  socket.on('get-commands', async (data) => {
    try {
      const guild = client.guilds.cache.get(data.guildId);
      if (!guild) {
        socket.emit('app-error', { message: 'サーバーが見つかりません' });
        return;
      }
      const commands = await guild.commands.fetch();
      socket.emit('commands-list', {
        commands: commands.map(cmd => ({
          id: cmd.id,
          name: cmd.name,
          description: cmd.description,
          options: cmd.options || []
        }))
      });
    } catch (error) {
      console.error('スラッシュコマンド取得エラー:', error);
      socket.emit('app-error', { message: 'スラッシュコマンドの取得に失敗しました' });
    }
  });

  socket.on('edit-message', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel) {
        socket.emit('app-error', { message: 'チャンネルが見つかりません' });
        return;
      }
      const message = await channel.messages.fetch(data.messageId);
      if (!message.editable) {
        socket.emit('app-error', { message: 'このメッセージは編集できません' });
        return;
      }
      const updated = await message.edit(data.content);
      socket.emit('message-edited', serializeMessage(updated));
    } catch (error) {
      console.error('メッセージ編集エラー:', error);
      socket.emit('app-error', { message: 'メッセージの編集に失敗しました: ' + error.message });
    }
  });

  socket.on('delete-message', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel) {
        socket.emit('app-error', { message: 'チャンネルが見つかりません' });
        return;
      }
      const message = await channel.messages.fetch(data.messageId);
      await message.delete();
      socket.emit('message-deleted', { messageId: data.messageId, channelId: data.channelId });
    } catch (error) {
      console.error('メッセージ削除エラー:', error);
      socket.emit('app-error', { message: 'メッセージの削除に失敗しました: ' + error.message });
    }
  });

  socket.on('reply-message', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel) {
        socket.emit('app-error', { message: 'チャンネルが見つかりません' });
        return;
      }
      const message = await channel.messages.fetch(data.messageId);
      const reply = await message.reply({ content: data.content, allowedMentions: { repliedUser: false } });
      socket.emit('message-replied', serializeMessage(reply));
    } catch (error) {
      console.error('返信エラー:', error);
      socket.emit('app-error', { message: '返信に失敗しました: ' + error.message });
    }
  });

  socket.on('add-reaction', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      const message = await channel.messages.fetch(data.messageId);
      await message.react(data.emoji);
      socket.emit('reaction-added', { success: true, messageId: data.messageId, emoji: data.emoji });
    } catch (error) {
      console.error('リアクション追加エラー:', error);
      socket.emit('app-error', { message: 'リアクション追加に失敗しました' });
    }
  });

  socket.on('remove-reaction', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      const message = await channel.messages.fetch(data.messageId);
      await message.reactions.cache.get(data.emoji)?.users.remove(client.user.id);
      socket.emit('reaction-removed', { success: true, messageId: data.messageId, emoji: data.emoji });
    } catch (error) {
      console.error('リアクション削除エラー:', error);
      socket.emit('app-error', { message: 'リアクションの削除に失敗しました' });
    }
  });

  socket.on('get-reaction-details', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel) {
        socket.emit('app-error', { message: 'チャンネルが見つかりません' });
        return;
      }
      const message = await channel.messages.fetch(data.messageId);
      const reactionDetails = await Promise.all(message.reactions.cache.map(async reaction => {
        const users = await reaction.users.fetch();
        return {
          emoji: reaction.emoji.name,
          count: reaction.count,
          me: reaction.me,
          users: users.map(user => ({
            id: user.id,
            username: user.username,
            tag: user.tag,
            avatar: user.displayAvatarURL()
          }))
        };
      }));
      socket.emit('reaction-details', {
        channelId: data.channelId,
        messageId: data.messageId,
        reactions: reactionDetails
      });
    } catch (error) {
      console.error('リアクション詳細取得エラー:', error);
      socket.emit('app-error', { message: 'リアクション詳細の取得に失敗しました' });
    }
  });

  socket.on('get-voice-members', async (data) => {
    try {
      const channel = client.channels.cache.get(data.channelId);
      if (!channel || channel.type !== ChannelType.GuildVoice) {
        socket.emit('app-error', { message: 'ボイスチャンネルが見つかりません' });
        return;
      }
      const members = channel.members.map(member => ({
        id: member.user.id,
        username: member.user.username,
        tag: member.user.tag,
        avatar: member.user.displayAvatarURL(),
        deaf: member.voice?.deaf || false,
        mute: member.voice?.mute || false,
        selfMute: member.voice?.selfMute || false,
        selfDeaf: member.voice?.selfDeaf || false,
        isBot: member.user.bot,
        status: member.presence?.status || 'offline'
      }));
      socket.emit('voice-members', { members, channelId: channel.id });
    } catch (error) {
      console.error('ボイスメンバー取得エラー:', error);
      socket.emit('app-error', { message: 'ボイスメンバーの取得に失敗しました' });
    }
  });

  socket.on('toggle-self-mute', async (data) => {
    try {
      const connection = voiceConnections.get(data.guildId);
      if (!connection) {
        socket.emit('app-error', { message: 'ボイス接続がありません' });
        return;
      }
      const nextMute = !connection.joinConfig.selfMute;
      if (typeof connection.rejoin !== 'function') {
        socket.emit('app-error', { message: 'ミュート切替に対応していません' });
        return;
      }
      connection.rejoin({ selfMute: nextMute, selfDeaf: connection.joinConfig.selfDeaf });
      socket.emit('self-mute-toggled', { guildId: data.guildId, selfMute: nextMute });
    } catch (error) {
      console.error('自己ミュート切替エラー:', error);
      socket.emit('app-error', { message: '自己ミュートの切替に失敗しました' });
    }
  });

  socket.on('get-members', async (data) => {
    try {
      const guild = client.guilds.cache.get(data.guildId);
      if (!guild) {
        socket.emit('app-error', { message: 'サーバーが見つかりません' });
        return;
      }

      try {
        // キャッシュが空の場合、少数だけ取得して表示を改善する
        if (guild.members.cache.size === 0) {
          await guild.members.fetch({ query: '', limit: 25 });
        }
      } catch (rateLimitError) {
        // レート制限が発生してもキャッシュの範囲で応答する
        if (rateLimitError.data?.retry_after) {
          console.warn(`レート制限: ${rateLimitError.data.retry_after}秒待機してください`);
        } else {
          throw rateLimitError;
        }
      }

      const members = guild.members.cache.map(member => ({
        id: member.user.id,
        username: member.user.username,
        tag: member.user.tag,
        avatar: member.user.displayAvatarURL(),
        status: member.presence?.status || 'offline',
        roles: member.roles.cache.map(role => role.name),
        createdAt: member.user.createdTimestamp,
        joinedAt: member.joinedTimestamp,
        isBot: member.user.bot
      }));

      socket.emit('members-list', { members });
    } catch (error) {
      console.error('メンバー取得エラー:', error);
      socket.emit('app-error', { message: 'メンバー取得に失敗しました' });
    }
  });

  socket.on('get-mention-suggestions', async (data) => {
    try {
      const guild = client.guilds.cache.get(data.guildId);
      if (!guild) {
        socket.emit('app-error', { message: 'サーバーが見つかりません' });
        return;
      }
      const query = (data.query || '').trim().toLowerCase();
      await guild.members.fetch({ query: query || undefined, limit: 25 });
      const suggestions = guild.members.cache
        .filter(member => !member.user.bot)
        .filter(member => {
          const needle = `${member.user.username}#${member.user.discriminator}`.toLowerCase();
          return !query || needle.includes(query) || member.user.username.toLowerCase().includes(query);
        })
        .slice(0, 20)
        .map(member => ({
          id: member.user.id,
          username: member.user.username,
          tag: member.user.tag,
          avatar: member.user.displayAvatarURL()
        }));

      socket.emit('mention-suggestions', { members: suggestions });
    } catch (error) {
      console.error('メンション候補取得エラー:', error);
      socket.emit('app-error', { message: 'メンション候補の取得に失敗しました' });
    }
  });

  // ユーザー詳細情報取得
  socket.on('get-user-profile', async (data) => {
    try {
      const user = await client.users.fetch(data.userId);
      const userInfo = {
        id: user.id,
        username: user.username,
        tag: user.tag,
        avatar: user.displayAvatarURL({ size: 512 }),
        bot: user.bot,
        system: user.system,
        createdAt: user.createdTimestamp,
        createdAtFormatted: new Date(user.createdTimestamp).toLocaleDateString('ja-JP'),
        banner: user.bannerURL({ size: 512 }),
        accentColor: user.accentColor
      };
      socket.emit('user-profile', userInfo);
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
      socket.emit('app-error', { message: 'ユーザー情報取得に失敗しました' });
    }
  });

  socket.on('join-call', (data) => {
    const roomId = data?.roomId;
    if (!roomId) {
      return;
    }
    const room = io.sockets.adapter.rooms.get(roomId);
    const existing = room ? Array.from(room).filter(id => id !== socket.id) : [];
    socket.join(roomId);
    socket.emit('call-joined', { roomId, existingParticipants: existing });
    socket.to(roomId).emit('call-participant-joined', { socketId: socket.id });
  });

  socket.on('leave-call', (data) => {
    const roomId = data?.roomId;
    if (!roomId) {
      return;
    }
    socket.leave(roomId);
    socket.to(roomId).emit('call-participant-left', { socketId: socket.id });
  });

  socket.on('call-signal', (data) => {
    const { targetId, signal } = data || {};
    if (!targetId || !signal) {
      return;
    }
    io.to(targetId).emit('call-signal', { from: socket.id, signal });
  });

  // ボイスチャンネルに参加
  // ⚠️ WebRTC による直接通話に移行したため、ボット側のボイスチャンネル参加は不要になりました
  // 以下のイベントリスナーは無効化しています。
  /*
  socket.on('join-voice', async (data) => {
    try {
      if (!botReady) {
        socket.emit('app-error', { message: 'ボットが接続されていません' });
        return;
      }

      const guild = client.guilds.cache.get(data.guildId);
      const channel = client.channels.cache.get(data.channelId);
      if (!guild || !channel || channel.type !== ChannelType.GuildVoice) {
        socket.emit('app-error', { message: 'ボイスチャンネルが見つかりません' });
        return;
      }

      const botMember = guild.members.me || await guild.members.fetch(client.user.id);
      const permissions = channel.permissionsFor(botMember);
      if (!permissions || !permissions.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.ViewChannel])) {
        socket.emit('app-error', { message: 'ボットにボイスチャンネルへの接続権限がありません' });
        return;
      }

      if (!channel.guild.voiceAdapterCreator) {
        socket.emit('app-error', { message: 'ボイスアダプターが初期化されていません。サーバーを再起動してください。' });
        return;
      }

      const existing = voiceConnections.get(guild.id);
      if (existing) {
        existing.destroy();
      }

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true
      });

// 🔄 Codespaces向け：シグナリングで止まってタイムアウト（AbortError）するのを防ぐハック
connection.on('stateChange', (oldState, newState) => {
  if (newState.status === 'connecting' || newState.status === 'signalling') {
    const networkTimeout = setTimeout(() => {
      if (connection.state.status !== 'ready') {
        console.log("⚠️ ネットワークを再構成しています...");
        // 強制的にネットワーク設定を初期化し、UDPトンネルの確立を試みます
        if (typeof connection.configureNetworking === 'function') {
          connection.configureNetworking();
        }
      }
    }, 10000); // 10秒待ってもReadyにならない場合
    
    connection.once('stateChange', () => clearTimeout(networkTimeout));
  }
});


      connection.on('debug', (info) => {
        console.debug('Voice debug:', info);
      });

      connection.on('stateChange', async (oldState, newState) => {
        console.log(`Voice connection state change: ${oldState.status} -> ${newState.status}`);
        socket.emit('voice-connection-state', {
          status: newState.status,
          guildId: guild.id,
          channelId: channel.id
        });

        if (newState.status === VoiceConnectionStatus.Disconnected) {
          const closeCode = newState.closeCode || newState.reason;
          console.warn(`Voice disconnected: ${closeCode}`);

          if (closeCode === 4014 || closeCode === '4014') {
            try {
              await entersState(connection, VoiceConnectionStatus.Connecting, 5000);
            } catch {
              connection.destroy();
            }
          } else if (connection.rejoinAttempts && connection.rejoinAttempts < 5) {
            setTimeout(() => connection.rejoin(), (connection.rejoinAttempts + 1) * 5000);
          } else {
            connection.destroy();
          }
        }

        if (newState.status === VoiceConnectionStatus.Destroyed) {
          voiceConnections.delete(guild.id);
        }
      });

      connection.on('error', (error) => {
        console.error('Voice connection error:', error);
        socket.emit('voice-error', { message: error.message });
      });

      monitorVoiceReady(connection, socket);

      voiceConnections.set(guild.id, connection);
      setupVoiceReceiver(connection, socket);
      socket.emit('voice-joined', { guildId: guild.id, channelId: channel.id, channelName: channel.name });
    } catch (error) {
      console.error('ボイス参加エラー:', error);
      socket.emit('app-error', { message: 'ボイスチャンネルへの参加に失敗しました: ' + (error.message || '接続できませんでした') });
      socket.emit('voice-error', { message: error.message || '接続できませんでした' });
    }
  });

  socket.on('leave-voice', async (data) => {
    try {
      const connection = voiceConnections.get(data.guildId);
      if (connection) {
        connection.destroy();
        voiceConnections.delete(data.guildId);
        socket.emit('voice-left', { guildId: data.guildId });
      } else {
        socket.emit('app-error', { message: '現在参加中のボイスチャンネルがありません' });
      }
    } catch (error) {
      console.error('ボイス退出エラー:', error);
      socket.emit('app-error', { message: 'ボイスチャンネルの退出に失敗しました' });
    }
  });
  */

  function setupVoiceReceiver(connection, socket) {
    const receiver = connection.receiver;
    const activeStreams = new Map();

    receiver.speaking.on('start', (userId) => {
      if (userId === client.user.id) return;
      if (activeStreams.has(userId)) return;

      const opusStream = receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.Manual
        }
      });
      const decoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });

      opusStream.pipe(decoder);

      decoder.on('data', (chunk) => {
        socket.emit('voice-data', {
          userId,
          audio: chunk.toString('base64'),
          guildId: connection.joinConfig.guildId
        });
      });

      const cleanup = () => {
        if (activeStreams.has(userId)) {
          const active = activeStreams.get(userId);
          if (active.opusStream) {
            active.opusStream.destroy();
          }
          if (active.decoder) {
            active.decoder.destroy();
          }
          activeStreams.delete(userId);
        }
      };

      opusStream.on('end', cleanup);
      opusStream.on('error', cleanup);
      decoder.on('error', cleanup);

      activeStreams.set(userId, { opusStream, decoder });
    });

    receiver.speaking.on('end', (userId) => {
      const active = activeStreams.get(userId);
      if (active) {
        if (active.opusStream) active.opusStream.destroy();
        if (active.decoder) active.decoder.destroy();
        activeStreams.delete(userId);
      }
    });
  }

function monitorVoiceReady(connection, socket) {
  entersState(connection, VoiceConnectionStatus.Ready, 60000)
    .then(() => {
      console.log('Voice connection is ready');
      socket.emit('voice-ready');
    })
    .catch((readyError) => {
      console.error('Voice ready monitor failed:', readyError);
      const retryCount = connection._voiceRetryCount || 0;
      if (retryCount < 2 && typeof connection.rejoin === 'function') {
        connection._voiceRetryCount = retryCount + 1;
        console.warn(`Retrying voice connection (${connection._voiceRetryCount})`);
        setTimeout(() => connection.rejoin(), 3000);
        return;
      }
      if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
        socket.emit('voice-error', { message: 'ボイス接続が完了しませんでした: ' + (readyError.message || 'タイムアウト') });
      }
    });
}

  socket.on('disconnect', () => {
    console.log(`ユーザー切断: ${socket.id}`);
    connectedUsers.delete(socket.id);
    socket.rooms.forEach(roomId => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('call-participant-left', { socketId: socket.id });
      }
    });
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
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
let currentPort = DEFAULT_PORT;
const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN || TOKEN === 'your_bot_token_here') {
  console.error('❌ エラー: .env ファイルに有効な DISCORD_TOKEN を設定してください');
  console.error('   1. Discord Developer Portal (https://discord.com/developers/applications) でボットを作成');
  console.error('   2. ボットのトークンをコピー');
  console.error('   3. .env ファイルの DISCORD_TOKEN= に貼り付け');
  process.exit(1);
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`⚠️ ポート ${currentPort} は既に使用中です。${currentPort + 1} を試します...`);
    currentPort += 1;
    if (currentPort > DEFAULT_PORT + 5) {
      console.error('❌ 使用可能なポートが見つかりませんでした。別のポートを指定するか、既存のプロセスを停止してください。');
      process.exit(1);
    }
    server.listen(currentPort);
    return;
  }

  console.error('❌ サーバー起動エラー:', error);
  process.exit(1);
});

server.listen(currentPort, () => {
  console.log(`🚀 サーバー起動: http://localhost:${currentPort}`);
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
