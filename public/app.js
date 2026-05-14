// Socket.IO接続
const socket = io();

// DOM要素
const loadingScreen = document.getElementById('loading');
const mainContainer = document.getElementById('main-container');
const guildsList = document.getElementById('guilds-list');
const channelHeader = document.getElementById('channel-header');
const channelName = document.getElementById('channel-name');
const channelTopic = document.getElementById('channel-topic');
const messagesContainer = document.getElementById('messages-container');
const messagesList = document.getElementById('messages-list');
const messageInput = document.getElementById('message-input');
const messageForm = document.getElementById('message-form');
const inputArea = document.getElementById('input-area');
const noSelection = document.getElementById('no-selection');
const membersPanel = document.getElementById('members-panel');
const membersList = document.getElementById('members-list');
const errorModal = document.getElementById('error-modal');
const errorMessage = document.getElementById('error-message');
const settingsModal = document.getElementById('settings-modal');
const botNameSpan = document.getElementById('bot-name');
const statusIndicator = document.getElementById('status-indicator');

// 状態管理
let currentGuildId = null;
let currentChannelId = null;
let currentChannelName = null;
const expandedGuilds = new Set();

// 初期化
function init() {
    loadingScreen.style.display = 'flex';
    mainContainer.style.display = 'none';

    // Socket.IOイベントリスナー
    socket.on('connection-success', handleConnectionSuccess);
    socket.on('bot-status', handleBotStatus);
    socket.on('bot-error', handleBotError);
    socket.on('guilds-list', handleGuildsList);
    socket.on('channels-list', handleChannelsList);
    socket.on('messages-list', handleMessagesList);
    socket.on('members-list', handleMembersList);
    socket.on('message-sent', handleMessageSent);
    socket.on('new-message', handleNewMessage);
    socket.on('error', handleSocketError);

    // ボタンイベント
    document.getElementById('refresh-btn').addEventListener('click', refreshData);
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('close-settings-btn').addEventListener('click', closeSettings);
    document.getElementById('save-token-btn').addEventListener('click', saveToken);
    document.getElementById('members-btn').addEventListener('click', toggleMembers);
    document.getElementById('close-members-btn').addEventListener('click', toggleMembers);
    document.getElementById('error-close-btn').addEventListener('click', closeError);

    // メッセージ送信
    messageForm.addEventListener('submit', sendMessage);
}

// 接続成功
function handleConnectionSuccess(data) {
    console.log('接続成功:', data.id);
    socket.emit('get-guilds');
}

// ボット状態
function handleBotStatus(data) {
    console.log('ボット状態:', data);
    
    if (data.ready) {
        statusIndicator.classList.add('connected');
        statusIndicator.classList.remove('loading');
        botNameSpan.textContent = data.user || 'ボット接続完了';
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContainer.style.display = 'flex';
            requestGuilds();
        }, 500);
    } else {
        statusIndicator.classList.add('loading');
        statusIndicator.classList.remove('connected');
        botNameSpan.textContent = 'ボット接続中...';
    }
}

// ボットエラー
function handleBotError(data) {
    console.error('ボットエラー:', data);
    showError('ボット接続エラー: ' + (data.error || '不明なエラー'));
}

// Socket.IOエラー
function handleSocketError(data) {
    console.error('ソケットエラー:', data);
    showError(data.message || 'エラーが発生しました');
}

// サーバー一覧取得
function handleGuildsList(data) {
    console.log('サーバー一覧:', data.guilds);
    guildsList.innerHTML = '';

    if (data.guilds.length === 0) {
        guildsList.innerHTML = '<div class="loading-text">サーバーがありません</div>';
        return;
    }

    data.guilds.forEach(guild => {
        const guildItem = document.createElement('div');
        guildItem.className = 'guild-item';
        guildItem.innerHTML = `
            <img src="${guild.icon || 'https://via.placeholder.com/32'}" class="guild-icon" alt="${guild.name}">
            <div class="guild-info">
                <div class="guild-name">${escapeHtml(guild.name)}</div>
                <div class="guild-count">${guild.memberCount} メンバー</div>
            </div>
        `;

        guildItem.addEventListener('click', () => selectGuild(guild.id, guild.name, guildItem));
        guildsList.appendChild(guildItem);

        // チャンネルサブメニューコンテナ
        const channelsSubmenu = document.createElement('div');
        channelsSubmenu.className = 'channels-submenu';
        channelsSubmenu.id = `channels-${guild.id}`;
        guildsList.appendChild(channelsSubmenu);
    });
}

// サーバー選択
function selectGuild(guildId, guildName, element) {
    currentGuildId = guildId;

    // アクティブ状態の更新
    document.querySelectorAll('.guild-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

    // チャンネルサブメニューの表示切り替え
    const submenu = document.getElementById(`channels-${guildId}`);
    const isExpanded = expandedGuilds.has(guildId);

    document.querySelectorAll('.channels-submenu').forEach(m => {
        m.classList.remove('show');
    });
    expandedGuilds.clear();

    if (!isExpanded) {
        submenu.classList.add('show');
        expandedGuilds.add(guildId);
        socket.emit('get-channels', { guildId });
    }
}

// チャンネル一覧取得
function handleChannelsList(data) {
    console.log('チャンネル一覧:', data.channels);
    const submenu = document.getElementById(`channels-${currentGuildId}`);
    submenu.innerHTML = '';

    if (data.channels.length === 0) {
        submenu.innerHTML = '<div class="loading-text">チャンネルがありません</div>';
        return;
    }

    data.channels.forEach(channel => {
        const channelItem = document.createElement('div');
        channelItem.className = 'channel-item';
        channelItem.innerHTML = `
            <span class="channel-icon">#</span>
            <span>${escapeHtml(channel.name)}</span>
        `;

        channelItem.addEventListener('click', () => selectChannel(channel.id, channel.name, channel.topic, channelItem));
        submenu.appendChild(channelItem);
    });
}

// チャンネル選択
function selectChannel(channelId, name, topic, element) {
    currentChannelId = channelId;
    currentChannelName = name;

    // アクティブ状態の更新
    document.querySelectorAll('.channel-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

    // UIの表示
    noSelection.style.display = 'none';
    channelHeader.style.display = 'flex';
    messagesContainer.style.display = 'flex';
    inputArea.style.display = 'block';

    // チャンネル情報の更新
    channelName.textContent = name;
    channelTopic.textContent = topic || 'トピックなし';

    // メッセージの読込
    messagesList.innerHTML = '<div class="loading-text">メッセージ読込中...</div>';
    socket.emit('get-messages', { channelId });
}

// メッセージ一覧取得
function handleMessagesList(data) {
    console.log('メッセージ一覧:', data.messages);
    messagesList.innerHTML = '';

    if (data.messages.length === 0) {
        messagesList.innerHTML = '<div class="loading-text">メッセージがありません</div>';
        return;
    }

    data.messages.forEach(msg => {
        const messageDiv = createMessageElement(msg);
        messagesList.appendChild(messageDiv);
    });

    // 最下部にスクロール
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// メッセージ要素作成
function createMessageElement(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const date = new Date(msg.timestamp);
    const timeStr = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <img src="${msg.avatar || 'https://via.placeholder.com/40'}" class="message-avatar" alt="${msg.author}">
        <div class="message-content-wrapper">
            <div class="message-header">
                <span class="message-author">${escapeHtml(msg.author)}</span>
                <span class="message-time">${timeStr}</span>
            </div>
            <div class="message-text">${escapeHtml(msg.content)}</div>
        </div>
    `;

    return messageDiv;
}

// メッセージ送信
function sendMessage(e) {
    e.preventDefault();

    const content = messageInput.value.trim();
    if (!content) return;

    if (!currentChannelId) {
        showError('チャンネルを選択してください');
        return;
    }

    messageInput.value = '';
    messageInput.disabled = true;

    socket.emit('send-message', {
        channelId: currentChannelId,
        content
    });
}

// メッセージ送信成功
function handleMessageSent(data) {
    console.log('メッセージ送信成功:', data);
    messageInput.disabled = false;
    messageInput.focus();

    if (data.success) {
        // メッセージをリストに追加
        socket.emit('get-messages', { channelId: currentChannelId });
    }
}

// 新規メッセージ受信
function handleNewMessage(data) {
    console.log('新規メッセージ:', data);

    // 現在のチャンネルのメッセージなら追加
    if (currentChannelId) {
        socket.emit('get-messages', { channelId: currentChannelId });
    }
}

// メンバー一覧取得
function handleMembersList(data) {
    console.log('メンバー一覧:', data.members);
    membersList.innerHTML = '';

    if (data.members.length === 0) {
        membersList.innerHTML = '<div class="loading-text">メンバーがありません</div>';
        return;
    }

    data.members.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';

        const statusText = member.status === 'online' ? 'オンライン' :
                          member.status === 'idle' ? 'アイドル' :
                          member.status === 'dnd' ? 'サイレント' : 'オフライン';

        memberItem.innerHTML = `
            <img src="${member.avatar || 'https://via.placeholder.com/28'}" class="member-avatar" alt="${member.username}">
            <div class="member-info">
                <div class="member-name">${escapeHtml(member.username)}</div>
                <div class="member-status">${statusText}</div>
            </div>
        `;

        membersList.appendChild(memberItem);
    });
}

// メンバーパネルの表示切り替え
function toggleMembers() {
    if (!currentGuildId) {
        showError('サーバーを選択してください');
        return;
    }

    const isVisible = membersPanel.style.display !== 'none';
    membersPanel.style.display = isVisible ? 'none' : 'flex';

    if (!isVisible) {
        socket.emit('get-members', { guildId: currentGuildId });
    }
}

// ユーティリティ関数
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showError(message) {
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
}

function closeError() {
    errorModal.style.display = 'none';
}

// 設定
function openSettings() {
    settingsModal.style.display = 'flex';
    const tokenInput = document.getElementById('token-input');
    const savedToken = localStorage.getItem('discord-token');
    if (savedToken) {
        tokenInput.value = savedToken;
    }
}

function closeSettings() {
    settingsModal.style.display = 'none';
}

function saveToken() {
    const tokenInput = document.getElementById('token-input');
    const token = tokenInput.value.trim();

    if (!token) {
        showError('トークンを入力してください');
        return;
    }

    localStorage.setItem('discord-token', token);
    closeSettings();
    showError('トークンを保存しました。ページをリロードしてください。');
}

// リフレッシュ
function refreshData() {
    if (currentChannelId) {
        messagesList.innerHTML = '<div class="loading-text">メッセージ読込中...</div>';
        socket.emit('get-messages', { channelId: currentChannelId });
    }
    socket.emit('get-guilds');
}

// サーバー一覧リクエスト
function requestGuilds() {
    socket.emit('get-guilds');
}

// 初期化実行
document.addEventListener('DOMContentLoaded', init);

// ページを離れる際のクリーンアップ
window.addEventListener('beforeunload', () => {
    socket.disconnect();
});
