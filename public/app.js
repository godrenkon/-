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
const voicePanel = document.getElementById('voice-panel');
const voicePanelStatus = document.getElementById('voice-panel-status');
const voicePanelInfo = document.getElementById('voice-panel-info');
const voicePanelLeaveButton = document.getElementById('voice-panel-leave');
const messageControls = document.getElementById('message-controls');
const loadEarlierButton = document.getElementById('load-earlier-btn');
const loadFullHistoryButton = document.getElementById('load-full-history-btn');
const reactionPanel = document.getElementById('reaction-panel');
const reactionPanelList = document.getElementById('reaction-panel-list');

// プロフィールモーダル
let profileModal = null;

// 状態管理
let currentGuildId = null;
let currentChannelId = null;
let currentChannelName = null;
let currentChannelType = null;
let audioContext = null;
let voiceChannelJoinedId = null;
let currentOldestMessageId = null;
let currentHasMoreMessages = false;
let currentSlashCommands = [];
let currentGuildMembers = [];
let activeAutocompleteItems = [];
let activeAutocompleteIndex = -1;
let replyTarget = null;
let editTarget = null;
let localAudioStream = null;
let callRoomId = null;
let peerConnections = {};
let remoteAudioElements = {};
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
    socket.on('more-messages-list', handleMoreMessagesList);
    socket.on('members-list', handleMembersList);
    socket.on('message-sent', handleMessageSent);
    socket.on('new-message', handleNewMessage);
    socket.on('voice-joined', handleVoiceJoined);
    socket.on('voice-left', handleVoiceLeft);
    socket.on('voice-data', handleVoiceData);
    socket.on('voice-error', handleVoiceError);
    socket.on('voice-ready', handleVoiceReady);
    socket.on('voice-connection-state', handleVoiceConnectionState);
    socket.on('voice-members', handleVoiceMembers);
    socket.on('self-mute-toggled', handleSelfMuteToggled);
    socket.on('call-joined', handleCallJoined);
    socket.on('call-participant-joined', handleCallParticipantJoined);
    socket.on('call-participant-left', handleCallParticipantLeft);
    socket.on('call-signal', handleCallSignal);
    socket.on('commands-list', handleCommandsList);
    socket.on('mention-suggestions', handleMentionSuggestions);
    socket.on('message-edited', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('message-updated', handleMessageUpdated);
    socket.on('reaction-added', handleReactionAdded);
    socket.on('reaction-removed', handleReactionRemoved);
    socket.on('reaction-updated', handleReactionUpdated);
    socket.on('reaction-details', handleReactionDetails);
    socket.on('user-profile', handleUserProfile);
    socket.on('app-error', handleSocketError);
    socket.on('error', handleSocketError);

    // ボタンイベント
    document.getElementById('refresh-btn').addEventListener('click', refreshData);
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('close-settings-btn').addEventListener('click', closeSettings);
    document.getElementById('save-token-btn').addEventListener('click', saveToken);
    document.getElementById('members-btn').addEventListener('click', toggleMembers);
    document.getElementById('close-members-btn').addEventListener('click', toggleMembers);
    document.getElementById('error-close-btn').addEventListener('click', closeError);
    if (voicePanelLeaveButton) {
        voicePanelLeaveButton.addEventListener('click', leaveVoiceChannel);
    }

    // ボイスステータス要素のクリックを安定化（要素が見つかれば常にハンドラを登録）
    const voiceStatusEl = document.getElementById('voice-status');
    if (voiceStatusEl) {
        voiceStatusEl.addEventListener('click', (e) => {
            console.debug('voice-status clicked', { currentGuildId, currentChannelId, currentChannelType });
            // クリックでボイス参加を試みる（現在選択中のチャンネルがボイスの場合）
            if (currentChannelType === 2) {
                joinVoiceByCurrent();
            }
        });
        voiceStatusEl.style.cursor = 'pointer';
        voiceStatusEl.setAttribute('role', 'button');
        voiceStatusEl.setAttribute('tabindex', '0');
    }
    loadEarlierButton.addEventListener('click', loadEarlierMessages);
    loadFullHistoryButton.addEventListener('click', loadFullHistory);
    messageInput.addEventListener('input', handleInputChange);
    messageInput.addEventListener('compositionend', handleInputChange);
    messageInput.addEventListener('focus', () => {
        if (currentGuildId && !currentSlashCommands.length) {
            socket.emit('get-commands', { guildId: currentGuildId });
        }
    });
    messageInput.addEventListener('keydown', handleInputKeyDown);
    const callBtn = document.getElementById('call-btn');
    if (callBtn) {
        callBtn.addEventListener('click', toggleCall);
    }
    const reactionPanelClose = document.getElementById('reaction-panel-close');
    if (reactionPanelClose) {
        reactionPanelClose.addEventListener('click', closeReactionPanel);
    }

    updateInputStatus();

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
    if (messageInput) {
        messageInput.disabled = false;
    }
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
        socket.emit('get-commands', { guildId });
        socket.emit('get-members', { guildId });
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
        const icon = channel.type === 2 ? '🔊' : '#';
        channelItem.innerHTML = `
            <span class="channel-icon">${icon}</span>
            <span>${escapeHtml(channel.name)}</span>
        `;

        channelItem.addEventListener('click', () => selectChannel(channel, channelItem));
        // ボイスチャンネルはダブルクリックで即参加できるようにする
        channelItem.addEventListener('dblclick', () => {
            selectChannel(channel, channelItem);
            if (channel.type === 2) {
                setTimeout(() => {
                    joinVoiceByCurrent();
                }, 50);
            }
        });
        submenu.appendChild(channelItem);
    });
}

// チャンネル選択
function selectChannel(channel, element) {
    currentChannelId = channel.id;
    currentChannelName = channel.name;
    currentChannelType = channel.type;

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
    channelName.textContent = channel.name;
    channelTopic.textContent = channel.topic || (channel.type === 2 ? 'ボイスチャンネル' : 'トピックなし');

    const voiceStatus = document.getElementById('voice-status');
    if (channel.type === 2) {
        inputArea.style.display = 'none';
        messagesList.innerHTML = '<div class="loading-text">ボイスチャンネルを選択しました。上部のステータスをクリックして参加してください。</div>';
        voiceStatus.textContent = '🔊 クリックしてボイスチャットに参加';
        voiceStatus.onclick = joinVoiceByCurrent;
        voiceStatus.style.cursor = 'pointer';
        if (voicePanel) {
            voicePanel.style.display = 'none';
        }
        if (messageControls) {
            messageControls.style.display = 'none';
        }
    } else {
        voiceStatus.textContent = '';
        voiceStatus.onclick = null;
        voiceStatus.style.cursor = 'default';
        inputArea.style.display = 'block';
        messagesList.innerHTML = '<div class="loading-text">メッセージ読込中...</div>';
        currentOldestMessageId = null;
        currentHasMoreMessages = false;
        updateMessageControls();
        if (!currentSlashCommands.length && currentGuildId) {
            socket.emit('get-commands', { guildId: currentGuildId });
        }
        socket.emit('get-messages', { channelId: channel.id });
    }
}

function joinVoiceChannel(channel) {
    ensureAudioContext();
    socket.emit('join-voice', { guildId: currentGuildId, channelId: channel.id });
}

// 現在選択中のサーバー/チャンネル情報を使って参加要求を送る安全なラッパー
function joinVoiceByCurrent() {
    if (!currentGuildId || !currentChannelId) {
        showError('参加するサーバーかチャンネルが選択されていません');
        return;
    }
    console.debug('joinVoiceByCurrent', { currentGuildId, currentChannelId });
    ensureAudioContext();
    socket.emit('join-voice', { guildId: currentGuildId, channelId: currentChannelId });
}

function ensureAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}


// メッセージ一覧取得
function handleMessagesList(data) {
    console.log('メッセージ一覧:', data.messages);
    messagesList.innerHTML = '';
    currentOldestMessageId = data.oldestMessageId || null;
    currentHasMoreMessages = data.hasMore || false;

    if (data.messages.length === 0) {
        messagesList.innerHTML = '<div class="loading-text">メッセージがありません</div>';
        updateMessageControls();
        return;
    }

    let lastAuthorId = null;
    let lastTimestamp = 0;
    data.messages.forEach(msg => {
        const isNewGroup = msg.authorId !== lastAuthorId || (msg.timestamp - lastTimestamp) > 60000;
        const messageDiv = createMessageElement(msg, isNewGroup);
        messagesList.appendChild(messageDiv);
        lastAuthorId = msg.authorId;
        lastTimestamp = msg.timestamp;
    });

    updateMessageControls();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleMoreMessagesList(data) {
    console.log('過去メッセージ:', data.messages);
    if (data.messages.length === 0) {
        currentHasMoreMessages = false;
        updateMessageControls();
        return;
    }

    const previousScrollHeight = messagesContainer.scrollHeight;
    const firstExisting = messagesList.firstChild;
    let nextAuthorId = firstExisting?.dataset?.authorId || null;
    let nextTimestamp = parseInt(firstExisting?.dataset?.timestamp || '0', 10) || 0;
    const newElements = [];

    for (let i = data.messages.length - 1; i >= 0; i--) {
        const msg = data.messages[i];
        const isNewGroup = msg.authorId !== nextAuthorId || (nextTimestamp && Math.abs(nextTimestamp - msg.timestamp) > 60000);
        const element = createMessageElement(msg, isNewGroup);
        newElements.push(element);
        nextAuthorId = msg.authorId;
        nextTimestamp = msg.timestamp;
    }

    for (let i = newElements.length - 1; i >= 0; i--) {
        messagesList.insertBefore(newElements[i], messagesList.firstChild);
    }

    currentOldestMessageId = data.oldestMessageId || currentOldestMessageId;
    currentHasMoreMessages = data.hasMore || false;
    updateMessageControls();
    messagesContainer.scrollTop = messagesContainer.scrollHeight - previousScrollHeight;
}

function renderAttachments(attachments) {
    if (!attachments || attachments.length === 0) return '';

    let attachmentHTML = '<div class="message-attachments">';
    attachments.forEach(att => {
        const isImage = att.contentType?.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(att.url);
        const isVideo = att.contentType?.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(att.url);

        if (isImage) {
            attachmentHTML += `
                <div class="attachment-image">
                    <img src="${att.url}" alt="${escapeHtml(att.name)}" class="message-image">
                    <a href="${att.url}" download="${escapeHtml(att.name)}" class="download-link" title="ダウンロード">⬇️</a>
                </div>
            `;
        } else if (isVideo) {
            attachmentHTML += `
                <div class="attachment-video">
                    <video controls class="message-video">
                        <source src="${att.url}" type="${att.contentType || 'video/mp4'}">
                        ブラウザがビデオをサポートしていません
                    </video>
                    <a href="${att.url}" download="${escapeHtml(att.name)}" class="download-link" title="ダウンロード">⬇️</a>
                </div>
            `;
        } else {
            attachmentHTML += `
                <div class="attachment-file">
                    <a href="${att.url}" download="${escapeHtml(att.name)}" class="file-link">📎 ${escapeHtml(att.name)}</a>
                </div>
            `;
        }
    });
    attachmentHTML += '</div>';
    return attachmentHTML;
}

function renderReactions(reactions) {
    if (!reactions || reactions.length === 0) return '';
    const reactionButtons = reactions.map(reaction => {
        const reactedClass = reaction.me ? ' reacted' : '';
        return `<button type="button" class="reaction${reactedClass}" data-emoji="${escapeHtml(reaction.id)}" data-me="${reaction.me}">${escapeHtml(reaction.emoji)} <span class="reaction-count">${reaction.count || 0}</span></button>`;
    });
    return `<div class="message-reactions">${reactionButtons.join('')}</div>`;
}

function formatMessageContent(content, mentions = []) {
    if (!content) return '';

    const mentionMap = currentGuildMembers.reduce((map, member) => {
        map[member.id] = member.username;
        return map;
    }, {});

    mentions.forEach(member => {
        if (member && member.id && member.username) {
            mentionMap[member.id] = mentionMap[member.id] || member.username;
        }
    });

    const transformed = content.replace(/<@!?(\d+)>/g, (match, userId) => {
        const displayName = mentionMap[userId] ? `@${mentionMap[userId]}` : `@${userId}`;
        return `@@MENTION:${userId}:${escapeHtml(displayName)}@@`;
    });

    let escaped = escapeHtml(transformed);
    escaped = escaped.replace(/@@MENTION:(\d+):([^@]+)@@/g, (match, userId, displayName) => {
        return `<span class="mention" data-user-id="${userId}">${displayName}</span>`;
    });
    escaped = escaped.replace(/\|\|([^|]+)\|\|/g, '<span class="spoiler">$1</span>');

    return linkify(escaped);
}

function formatMessageTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date >= today) {
        return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    }

    const isSameYear = date.getFullYear() === now.getFullYear();
    if (date >= yesterday) {
        return date.toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function linkify(text) {
    return text.replace(/(https?:\/\/[^\s]+)/g, match => {
        const url = escapeHtml(match);
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

// メッセージ要素作成
function createMessageElement(msg, showHeader = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.dataset.authorId = msg.authorId;
    messageDiv.dataset.timestamp = msg.timestamp;
    if (!showHeader) {
        messageDiv.classList.add('message-compact');
    }

    const timeStr = formatMessageTimestamp(msg.timestamp);
    const attachmentHTML = renderAttachments(msg.attachments);
    const embedHTML = renderEmbeds(msg.embeds);
    const contentHTML = formatMessageContent(msg.content, msg.mentions || []);
    const replyHTML = msg.replyTo ? `
            <div class="message-reply-preview">
                <span class="reply-label">返信先</span>
                <span class="reply-author">${escapeHtml(msg.replyTo.author || '不明')}</span>
            </div>
        ` : '';
    const reactionsHTML = renderReactions(msg.reactions);

    messageDiv.dataset.messageId = msg.id;
    messageDiv.innerHTML = `
        <img src="${msg.avatar || 'https://via.placeholder.com/40'}" class="message-avatar" alt="${escapeHtml(msg.author)}">
        <div class="message-content-wrapper">
            ${showHeader ? `
                <div class="message-header">
                    <span class="message-author" style="cursor: pointer;">${escapeHtml(msg.author)}</span>
                    <span class="message-time">${timeStr}</span>
                </div>
            ` : ''}
            ${replyHTML}
            <div class="message-text">${contentHTML}</div>
            ${attachmentHTML}
            ${embedHTML}
            ${reactionsHTML}
            <div class="message-actions">
                <button type="button" data-action="reply">🔁 返信</button>
                <button type="button" data-action="react">😊 リアクション</button>
                <button type="button" data-action="edit">✏️ 編集</button>
                <button type="button" data-action="delete">🗑️ 削除</button>
            </div>
        </div>
    `;

    const avatarEl = messageDiv.querySelector('.message-avatar');
    const authorEl = messageDiv.querySelector('.message-author');
    if (avatarEl) {
        avatarEl.addEventListener('click', () => showUserProfile(msg.authorId));
    }
    if (authorEl) {
        authorEl.addEventListener('click', () => showUserProfile(msg.authorId));
    }

    messageDiv.querySelectorAll('.mention').forEach(span => {
        span.addEventListener('click', () => showUserProfile(span.dataset.userId));
    });

    const actions = messageDiv.querySelector('.message-actions');
    if (actions) {
        actions.addEventListener('click', (e) => handleMessageAction(e, msg));
    }

    const reactionButtons = messageDiv.querySelectorAll('.reaction');
    reactionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const emoji = button.dataset.emoji;
            const alreadyReacted = button.dataset.me === 'true';
            if (!emoji) return;
            if (alreadyReacted) {
                socket.emit('remove-reaction', { channelId: msg.channelId, messageId: msg.id, emoji });
            } else {
                socket.emit('add-reaction', { channelId: msg.channelId, messageId: msg.id, emoji });
            }
        });
    });

    messageDiv.addEventListener('click', (e) => {
        if (e.target.closest('.message-actions') || e.target.closest('button') || e.target.closest('a')) return;
        if (msg.reactions && msg.reactions.length) {
            showReactionDetails(msg);
        }
    });

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

    const payload = {
        channelId: currentChannelId,
        content
    };

    if (editTarget) {
        payload.messageId = editTarget.id;
        socket.emit('edit-message', payload);
    } else if (replyTarget) {
        payload.messageId = replyTarget.id;
        socket.emit('reply-message', payload);
    } else {
        socket.emit('send-message', payload);
    }

    messageInput.disabled = true;
}

function handleMessageSent(data) {
    console.log('メッセージ送信成功:', data);
    messageInput.disabled = false;
    messageInput.focus();
    messageInput.value = '';

    if (editTarget) {
        clearEditTarget();
    }
    if (replyTarget) {
        clearReplyTarget();
    }

    if (data.success) {
        socket.emit('get-messages', { channelId: currentChannelId });
    }
}

function handleInputChange() {
    const cursor = messageInput.selectionStart;
    const value = messageInput.value;
    const prefix = value.slice(0, cursor);
    const slashMatch = /(?:^|\s)\/(\S*)$/.exec(prefix);
    const mentionMatch = /(?:^|\s)@(\S*)$/.exec(prefix);

    if (slashMatch && currentGuildId) {
        const query = slashMatch[1].toLowerCase();
        if (currentSlashCommands.length === 0) {
            socket.emit('get-commands', { guildId: currentGuildId });
        }
        const items = currentSlashCommands
            .filter(cmd => cmd.name.toLowerCase().includes(query) || (cmd.description || '').toLowerCase().includes(query))
            .slice(0, 20)
            .map(cmd => ({ type: 'command', id: cmd.id, name: cmd.name, description: cmd.description }));
        showAutocomplete(items, 'command');
        return;
    }

    if (mentionMatch && currentGuildId) {
        const query = mentionMatch[1].toLowerCase();
        const localMatches = currentGuildMembers
            .filter(member => member.username.toLowerCase().includes(query) || member.tag.toLowerCase().includes(query))
            .slice(0, 20)
            .map(member => ({ type: 'mention', id: member.id, username: member.username, tag: member.tag }));

        if (localMatches.length) {
            showAutocomplete(localMatches, 'mention');
            return;
        }

        if (!currentGuildMembers.length) {
            socket.emit('get-members', { guildId: currentGuildId });
        }
        socket.emit('get-mention-suggestions', { guildId: currentGuildId, query });
        return;
    }

    clearAutocomplete();
}

function handleInputKeyDown(event) {
    if (!activeAutocompleteItems.length) return;

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        activeAutocompleteIndex = Math.min(activeAutocompleteItems.length - 1, activeAutocompleteIndex + 1);
        updateAutocompleteSelection();
        return;
    }
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        activeAutocompleteIndex = Math.max(0, activeAutocompleteIndex - 1);
        updateAutocompleteSelection();
        return;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
        if (activeAutocompleteIndex >= 0) {
            event.preventDefault();
            selectAutocompleteItem(activeAutocompleteIndex);
        }
        return;
    }
    if (event.key === 'Escape') {
        clearAutocomplete();
    }
}

function updateAutocompleteSelection() {
    const list = document.getElementById('autocomplete-list');
    if (!list) return;
    list.querySelectorAll('.autocomplete-item').forEach((item, index) => {
        item.classList.toggle('selected', index === activeAutocompleteIndex);
    });
}

function selectAutocompleteItem(index) {
    const item = activeAutocompleteItems[index];
    if (!item) return;
    insertAutocompleteItem(item);
    clearAutocomplete();
}

function insertAutocompleteItem(item) {
    const cursor = messageInput.selectionStart;
    const value = messageInput.value;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);

    if (item.type === 'command') {
        const replaced = before.replace(/(?:^|\s)\/(\S*)$/, (match, token) => {
            return match.slice(0, match.length - token.length - 1) + `/${item.name} `;
        });
        messageInput.value = replaced + after;
        messageInput.selectionStart = messageInput.selectionEnd = replaced.length;
    } else if (item.type === 'mention') {
        const replaced = before.replace(/(?:^|\s)@(\S*)$/, (match, token) => {
            const prefix = match.startsWith(' ') ? ' ' : '';
            return `${prefix}<@${item.id}> `;
        });
        messageInput.value = replaced + after;
        messageInput.selectionStart = messageInput.selectionEnd = replaced.length;
    }
    messageInput.focus();
}

function showAutocomplete(items, type) {
    const container = document.getElementById('autocomplete-container');
    const list = document.getElementById('autocomplete-list');
    if (!container || !list) return;

    activeAutocompleteItems = items;
    activeAutocompleteIndex = items.length > 0 ? 0 : -1;
    list.innerHTML = items.map((item, index) => {
        const label = item.type === 'command' ? `/${item.name}` : `@${item.username}`;
        const description = item.type === 'command' ? item.description || '' : item.tag || '';
        return `<li class="autocomplete-item${index === activeAutocompleteIndex ? ' selected' : ''}" data-index="${index}"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(description)}</span></li>`;
    }).join('');

    if (items.length === 0) {
        clearAutocomplete();
        return;
    }

    container.style.display = 'block';
    list.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => selectAutocompleteItem(parseInt(item.dataset.index, 10)));
    });
}

function clearAutocomplete() {
    const container = document.getElementById('autocomplete-container');
    const list = document.getElementById('autocomplete-list');
    if (!container || !list) return;
    container.style.display = 'none';
    list.innerHTML = '';
    activeAutocompleteItems = [];
    activeAutocompleteIndex = -1;
}

function handleCommandsList(data) {
    currentSlashCommands = data.commands || [];
    handleInputChange();
}

function handleMentionSuggestions(data) {
    const items = (data.members || []).map(member => ({
        type: 'mention',
        id: member.id,
        username: member.username,
        tag: member.tag
    }));
    showAutocomplete(items, 'mention');
}

function handleMessageAction(event, msg) {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (!action) return;
    if (action === 'reply') {
        setReplyTarget(msg);
        return;
    }
    if (action === 'edit') {
        setEditTarget(msg);
        return;
    }
    if (action === 'delete') {
        if (confirm('このメッセージを削除しますか？')) {
            socket.emit('delete-message', { channelId: currentChannelId, messageId: msg.id });
        }
        return;
    }
    if (action === 'react') {
        const emoji = prompt('リアクションに追加する絵文字を入力してください（例: 👍）');
        if (emoji) {
            socket.emit('add-reaction', { channelId: currentChannelId, messageId: msg.id, emoji });
        }
    }
}

function setReplyTarget(msg) {
    replyTarget = { id: msg.id, author: msg.author };
    updateInputStatus();
    messageInput.focus();
}

function clearReplyTarget() {
    replyTarget = null;
    updateInputStatus();
}

function setEditTarget(msg) {
    if (!msg.canEdit) {
        showError('このメッセージは編集できません');
        return;
    }
    editTarget = { id: msg.id };
    replyTarget = null;
    messageInput.value = msg.content || '';
    updateInputStatus();
    messageInput.focus();
}

function clearEditTarget() {
    editTarget = null;
    updateInputStatus();
}

function updateInputStatus() {
    const status = document.getElementById('reply-status');
    const text = document.getElementById('reply-text');
    const cancel = document.getElementById('cancel-reply');
    if (!status || !text || !cancel) return;

    if (editTarget) {
        status.style.display = 'flex';
        text.textContent = '編集中のメッセージを更新します';
        cancel.onclick = clearEditTarget;
        messageInput.placeholder = '編集する内容を入力して Enter';
        return;
    }

    if (replyTarget) {
        status.style.display = 'flex';
        text.textContent = `返信先: ${replyTarget.author} のメッセージ`;
        cancel.onclick = clearReplyTarget;
        messageInput.placeholder = '返信内容を入力して Enter';
        return;
    }

    status.style.display = 'none';
    messageInput.placeholder = 'メッセージを入力...';
}

function handleMessageEdited(data) {
    if (data.channelId === currentChannelId) {
        socket.emit('get-messages', { channelId: currentChannelId });
    }
}

function handleMessageDeleted(data) {
    if (data.channelId === currentChannelId) {
        socket.emit('get-messages', { channelId: currentChannelId });
    }
}

function handleMessageUpdated(data) {
    if (data.channelId === currentChannelId) {
        socket.emit('get-messages', { channelId: currentChannelId });
    }
}

function handleReactionAdded(data) {
    if (data.channelId === currentChannelId) {
        socket.emit('get-messages', { channelId: currentChannelId });
    }
}

function handleReactionRemoved(data) {
    if (data.channelId === currentChannelId) {
        socket.emit('get-messages', { channelId: currentChannelId });
    }
}

function handleReactionUpdated(data) {
    if (data.channelId === currentChannelId) {
        socket.emit('get-messages', { channelId: currentChannelId });
    }
}

function showReactionDetails(msg) {
    socket.emit('get-reaction-details', { channelId: currentChannelId, messageId: msg.id });
}

function handleReactionDetails(data) {
    if (data.channelId !== currentChannelId) return;
    if (!reactionPanel || !reactionPanelList) return;

    reactionPanelList.innerHTML = '';
    if (!data.reactions || data.reactions.length === 0) {
        reactionPanelList.innerHTML = '<div class="loading-text">リアクションはありません</div>';
    } else {
        data.reactions.forEach(reaction => {
            const reactionBlock = document.createElement('div');
            reactionBlock.className = 'reaction-detail-block';
            reactionBlock.innerHTML = `
                <div class="reaction-detail-header">
                    <span class="reaction-detail-emoji">${escapeHtml(reaction.emoji)}</span>
                    <span class="reaction-detail-count">${reaction.count || 0} 件</span>
                    ${reaction.me ? '<span class="reaction-detail-self">自分</span>' : ''}
                </div>
                <div class="reaction-detail-users"></div>
            `;
            const usersContainer = reactionBlock.querySelector('.reaction-detail-users');
            if (usersContainer) {
                if (reaction.users && reaction.users.length > 0) {
                    reaction.users.forEach(user => {
                        const userItem = document.createElement('div');
                        userItem.className = 'reaction-user-item';
                        userItem.innerHTML = `
                            <img src="${user.avatar || 'https://via.placeholder.com/24'}" class="reaction-user-avatar" alt="${escapeHtml(user.username)}">
                            <span>${escapeHtml(user.username)}#${escapeHtml(user.tag)}</span>
                        `;
                        usersContainer.appendChild(userItem);
                    });
                } else {
                    usersContainer.innerHTML = '<div class="loading-text">ユーザー情報がありません</div>';
                }
            }
            reactionPanelList.appendChild(reactionBlock);
        });
    }
    reactionPanel.style.display = 'block';
}

function closeReactionPanel() {
    if (!reactionPanel) return;
    reactionPanel.style.display = 'none';
}

// 新規メッセージ受信
function handleNewMessage(data) {
    console.log('新規メッセージ:', data);

    if (currentChannelId && data.channelId === currentChannelId) {
        socket.emit('get-messages', { channelId: currentChannelId });
    }
}

function handleVoiceError(data) {
    console.error('ボイスエラー:', data);
    showError('ボイスエラー: ' + (data.message || '不明なエラー'));
    if (voicePanelStatus) {
        voicePanelStatus.textContent = '接続エラー';
    }
}

function handleVoiceReady() {
    if (voicePanelStatus) {
        voicePanelStatus.textContent = '接続完了';
    }
}

function handleVoiceConnectionState(data) {
    if (!voicePanelStatus) return;
    const statusText = data.status || 'unknown';
    const statusMap = {
        signalling: 'シグナリング',
        connecting: '接続中...',
        ready: '接続完了',
        disconnected: '切断済み',
        destroyed: '破棄済み'
    };
    voicePanelStatus.textContent = statusMap[statusText] || statusText;
}

function handleVoiceMembers(data) {
    const membersContainer = document.getElementById('voice-panel-members');
    if (!membersContainer) return;
    membersContainer.innerHTML = '';

    if (!data.members || data.members.length === 0) {
        membersContainer.innerHTML = '<div class="loading-text">ボイスメンバーがいません</div>';
        return;
    }

    data.members.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'voice-member';
        memberItem.innerHTML = `
            <img src="${member.avatar || 'https://via.placeholder.com/32'}" class="voice-member-avatar" alt="${escapeHtml(member.username)}">
            <div class="voice-member-info">
                <div class="voice-member-name">${escapeHtml(member.username)}${member.isBot ? ' 🤖' : ''}</div>
                <div class="voice-member-status">${member.selfMute ? '🔇 ミュート' : member.mute ? 'ミュート' : member.selfDeaf ? 'デフ' : '発言可'}</div>
            </div>
        `;
        memberItem.addEventListener('click', () => showUserProfile(member.id));
        membersContainer.appendChild(memberItem);
    });
}

function handleSelfMuteToggled(data) {
    const muteButton = document.getElementById('voice-panel-selfmute');
    if (muteButton) {
        muteButton.textContent = data.selfMute ? 'ミュート解除' : 'ミュート';
    }
}

function showVoicePanel(channelName, statusText = '接続中...') {
    if (!voicePanel) return;
    voicePanel.style.display = 'block';
    if (voicePanelStatus) {
        voicePanelStatus.textContent = statusText;
    }
    if (voicePanelInfo) {
        voicePanelInfo.textContent = `ボイス接続中: ${escapeHtml(channelName)}`;
    }
}

function hideVoicePanel() {
    if (!voicePanel) return;
    voicePanel.style.display = 'none';
    if (voicePanelStatus) {
        voicePanelStatus.textContent = '未接続';
    }
    if (voicePanelInfo) {
        voicePanelInfo.textContent = '';
    }
}

// メンバー一覧取得
function handleMembersList(data) {
    console.log('メンバー一覧:', data.members);
    currentGuildMembers = data.members || [];
    membersList.innerHTML = '';

    if (!data.members || data.members.length === 0) {
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
            <img src="${member.avatar || 'https://via.placeholder.com/28'}" class="member-avatar" alt="${escapeHtml(member.username)}">
            <div class="member-info">
                <div class="member-name">${escapeHtml(member.username)}</div>
                <div class="member-status">${statusText}</div>
            </div>
        `;

        memberItem.addEventListener('click', () => showUserProfile(member.id));
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
    const str = String(text || '');
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, m => map[m]);
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

// プロフィール表示
function showUserProfile(userId, username) {
    const modal = document.getElementById('profile-modal');
    const profileContent = document.getElementById('profile-content');
    
    profileContent.innerHTML = '<div class="loading-text">読込中...</div>';
    modal.style.display = 'flex';
    
    socket.emit('get-user-profile', { userId });
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    modal.style.display = 'none';
}

function handleUserProfile(data) {
    const profileContent = document.getElementById('profile-content');
    const createdAt = new Date(data.createdAt).toLocaleDateString('ja-JP');
    
    profileContent.innerHTML = `
        <div class="profile-header">
            <img src="${data.avatar}" alt="${data.username}" class="profile-avatar">
            <div class="profile-info">
                <h2>${escapeHtml(data.username)}</h2>
                <p class="profile-tag">${escapeHtml(data.tag)}</p>
                ${data.bot ? '<span class="bot-badge">ボット</span>' : ''}
            </div>
        </div>
        <div class="profile-details">
            <p><strong>アカウント作成日:</strong> ${createdAt}</p>
            <p><strong>ユーザーID:</strong> <code>${data.id}</code></p>
        </div>
    `;
}

function handleVoiceJoined(data) {
    const voiceStatus = document.getElementById('voice-status');
    voiceChannelJoinedId = data.guildId;
    voiceStatus.textContent = `🎧 参加中: ${escapeHtml(data.channelName)} (クリックで退出)`;
    voiceStatus.style.cursor = 'pointer';
    voiceStatus.onclick = leaveVoiceChannel;
    showVoicePanel(data.channelName, '接続中...');
    if (currentChannelId && currentChannelType === 2) {
        socket.emit('get-voice-members', { channelId: currentChannelId });
    }
    const muteButton = document.getElementById('voice-panel-selfmute');
    if (muteButton) {
        muteButton.textContent = 'ミュート';
        muteButton.onclick = () => socket.emit('toggle-self-mute', { guildId: data.guildId });
    }
    const refreshButton = document.getElementById('voice-panel-refresh');
    if (refreshButton) {
        refreshButton.onclick = () => socket.emit('get-voice-members', { channelId: currentChannelId });
    }
}

function handleVoiceLeft() {
    const voiceStatus = document.getElementById('voice-status');
    voiceChannelJoinedId = null;
    voiceStatus.textContent = '🔊 ボイスチャンネル';
    voiceStatus.style.cursor = 'pointer';
    voiceStatus.onclick = () => {
        if (!currentChannelType || currentChannelType !== 2) return;
        socket.emit('join-voice', { guildId: currentGuildId, channelId: currentChannelId });
    };
    hideVoicePanel();
}

function leaveVoiceChannel() {
    if (!currentGuildId) {
        showError('現在のサーバー情報が不足しています');
        return;
    }
    socket.emit('leave-voice', { guildId: currentGuildId });
}

function handleVoiceData(data) {
    if (!audioContext) {
        console.warn('AudioContext がありません');
        return;
    }

    const buffer = base64ToArrayBuffer(data.audio);
    const pcm = new Int16Array(buffer);
    const frameCount = pcm.length / 2;
    const audioBuffer = audioContext.createBuffer(2, frameCount, 48000);
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);

    for (let i = 0, j = 0; i < pcm.length; i += 2, j += 1) {
        left[j] = pcm[i] / 32768;
        right[j] = pcm[i + 1] / 32768;
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
}

// 通話用のICEサーバー設定
// 学校や会社の制限があるネットワークでは、P2P接続が失敗する場合があります。
// STUNだけでは接続できない場合、TURNサーバーの用意が必要になります。
const callIceConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

function getCallRoomId() {
    if (!currentGuildId || !currentChannelId) return null;
    return `${currentGuildId}-${currentChannelId}`;
}

function updateCallStatus(message, active = false) {
    const callStatus = document.getElementById('call-status');
    const callBtn = document.getElementById('call-btn');
    if (callStatus) {
        callStatus.textContent = message || '';
        callStatus.style.display = active ? 'block' : (message ? 'block' : 'none');
    }
    if (callBtn) {
        callBtn.textContent = active ? '📞 通話終了' : '📞 通話開始';
    }
}

async function toggleCall() {
    if (callRoomId) {
        stopCall();
    } else {
        await startCall();
    }
}

async function startCall() {
    if (!currentChannelId || !currentGuildId) {
        showError('通話を開始するにはチャネルを選択してください');
        return;
    }

    try {
        updateCallStatus('マイクを起動中...', true);
        localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        callRoomId = getCallRoomId();
        if (!callRoomId) {
            showError('通話ルームを生成できませんでした');
            return;
        }
        socket.emit('join-call', { roomId: callRoomId });
        updateCallStatus('通話接続中...', true);
    } catch (error) {
        console.error('通話開始エラー:', error);
        updateCallStatus('', false);
        showError('通話を開始できませんでした: ' + (error.message || 'マイクへのアクセスが拒否されました'));
    }
}

function stopCall() {
    if (!callRoomId) return;
    socket.emit('leave-call', { roomId: callRoomId });
    cleanupCall();
    updateCallStatus('通話を終了しました');
}

function cleanupCall() {
    Object.keys(peerConnections).forEach(removeCallPeer);
    peerConnections = {};
    Object.values(remoteAudioElements).forEach(el => el.remove());
    remoteAudioElements = {};
    if (localAudioStream) {
        localAudioStream.getTracks().forEach(track => track.stop());
        localAudioStream = null;
    }
    callRoomId = null;
}

function handleCallJoined(data) {
    if (!data || data.roomId !== callRoomId) return;
    const existingParticipants = data.existingParticipants || [];
    existingParticipants.forEach(async peerId => {
        if (peerId === socket.id) return;
        await createPeerConnection(peerId, true);
    });
    updateCallStatus('通話中...', true);
}

function handleCallParticipantJoined(data) {
    if (!data || data.socketId === socket.id) return;
    const callStatus = document.getElementById('call-status');
    if (callStatus && callRoomId) {
        callStatus.textContent = '通話中...';
    }
}

function handleCallParticipantLeft(data) {
    if (!data || !data.socketId) return;
    removeCallPeer(data.socketId);
}

async function handleCallSignal(payload) {
    if (!payload || !payload.from || !payload.signal) return;
    if (!callRoomId) return;

    const peerId = payload.from;
    const signal = payload.signal;
    const pc = peerConnections[peerId] ? peerConnections[peerId].pc : await createPeerConnection(peerId, false);

    try {
        if (signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('call-signal', { roomId: callRoomId, targetId: peerId, signal: pc.localDescription });
        } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.type === 'candidate' && signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
    } catch (error) {
        console.error('call-signal error:', error);
    }
}

async function createPeerConnection(peerId, isInitiator) {
    if (peerConnections[peerId]) {
        return peerConnections[peerId].pc;
    }

    const pc = new RTCPeerConnection(callIceConfig);
    peerConnections[peerId] = { pc, audioEl: null };

    if (localAudioStream) {
        localAudioStream.getTracks().forEach(track => pc.addTrack(track, localAudioStream));
    }

    pc.onicecandidate = event => {
        if (event.candidate && callRoomId) {
            socket.emit('call-signal', {
                roomId: callRoomId,
                targetId: peerId,
                signal: {
                    type: 'candidate',
                    candidate: event.candidate
                }
            });
        }
    };

    pc.ontrack = event => {
        if (event.streams && event.streams[0]) {
            handleRemoteStream(peerId, event.streams[0]);
        }
    };

    pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
            removeCallPeer(peerId);
        }
    };

    if (isInitiator && callRoomId) {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('call-signal', { roomId: callRoomId, targetId: peerId, signal: pc.localDescription });
        } catch (error) {
            console.error('offer error:', error);
        }
    }

    return pc;
}

function handleRemoteStream(peerId, stream) {
    const container = document.getElementById('call-streams');
    if (!container) return;

    if (remoteAudioElements[peerId]) {
        remoteAudioElements[peerId].srcObject = stream;
        return;
    }

    const audioItem = document.createElement('div');
    audioItem.className = 'call-audio-item';
    const info = document.createElement('span');
    info.textContent = `相手: ${peerId}`;
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioEl.playsInline = true;
    audioEl.srcObject = stream;
    audioItem.appendChild(info);
    audioItem.appendChild(audioEl);
    container.appendChild(audioItem);
    remoteAudioElements[peerId] = audioItem;
}

function removeCallPeer(peerId) {
    if (peerConnections[peerId]) {
        try {
            peerConnections[peerId].pc.close();
        } catch (_e) {}
        delete peerConnections[peerId];
    }
    if (remoteAudioElements[peerId]) {
        remoteAudioElements[peerId].remove();
        delete remoteAudioElements[peerId];
    }
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function updateMessageControls() {
    if (!messageControls) return;
    if (!currentChannelId || currentChannelType === 2) {
        messageControls.style.display = 'none';
        return;
    }

    messageControls.style.display = 'flex';
    loadEarlierButton.disabled = !currentHasMoreMessages;
    loadFullHistoryButton.disabled = !currentHasMoreMessages;
    loadEarlierButton.textContent = currentHasMoreMessages ? '過去のメッセージを読み込む' : 'これ以上のメッセージはありません';
    loadFullHistoryButton.textContent = currentHasMoreMessages ? '全履歴を読み込む' : 'すべて読み込み済み';
}

function loadEarlierMessages() {
    if (!currentChannelId || !currentOldestMessageId) return;
    loadEarlierButton.disabled = true;
    socket.emit('get-more-messages', {
        channelId: currentChannelId,
        before: currentOldestMessageId,
        limit: 100
    });
}

function loadFullHistory() {
    if (!currentChannelId) return;
    messagesList.innerHTML = '<div class="loading-text">全履歴を読み込んでいます...</div>';
    currentOldestMessageId = null;
    currentHasMoreMessages = false;
    updateMessageControls();
    socket.emit('get-messages', {
        channelId: currentChannelId,
        limit: 10000,
        fetchAll: true
    });
}

function renderEmbeds(embeds) {
    if (!embeds || embeds.length === 0) return '';

    return embeds.map(embed => {
        let embedHTML = '<div class="message-embed">';
        if (embed.title) {
            embedHTML += `<div class="embed-title">${escapeHtml(embed.title)}</div>`;
        }
        if (embed.description) {
            embedHTML += `<div class="embed-description">${linkify(escapeHtml(embed.description))}</div>`;
        }
        if (embed.image) {
            embedHTML += `
                <div class="attachment-image">
                    <img src="${escapeHtml(embed.image)}" alt="embed image" class="message-image">
                </div>
            `;
        }
        if (embed.thumbnail) {
            embedHTML += `
                <div class="attachment-image embed-thumbnail">
                    <img src="${escapeHtml(embed.thumbnail)}" alt="thumbnail" class="message-image">
                </div>
            `;
        }
        if (embed.fields && embed.fields.length > 0) {
            embedHTML += '<div class="embed-fields">';
            embed.fields.forEach(field => {
                embedHTML += `
                    <div class="embed-field">
                        <div class="embed-field-name">${escapeHtml(field.name)}</div>
                        <div class="embed-field-value">${escapeHtml(field.value)}</div>
                    </div>
                `;
            });
            embedHTML += '</div>';
        }
        if (embed.url) {
            embedHTML += `<div class="embed-footer"><a href="${escapeHtml(embed.url)}" target="_blank" rel="noopener noreferrer">リンクを開く</a></div>`;
        }
        embedHTML += '</div>';
        return embedHTML;
    }).join('');
}

// モーダル外クリックで閉じる
document.addEventListener('click', (e) => {
    const profileModal = document.getElementById('profile-modal');
    if (e.target === profileModal) {
        profileModal.style.display = 'none';
    }

    const autocompleteContainer = document.getElementById('autocomplete-container');
    if (autocompleteContainer && !autocompleteContainer.contains(e.target) && e.target !== messageInput) {
        clearAutocomplete();
    }
});
