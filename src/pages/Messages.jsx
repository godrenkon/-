import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Search, UserPlus } from 'lucide-react';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function Messages() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const msgEndRef = useRef(null);

  useEffect(() => { loadProfiles(); loadMessages(); }, []);
  useEffect(() => { if (selectedUser) loadConversation(selectedUser); }, [selectedUser]);
  useEffect(() => { if (messages.length > 0) setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }, [messages]);

  const loadProfiles = async () => {
    try {
      const data = await base44.entities.Profile.list(undefined, 500);
      setAllProfiles(data || []);
      const map = {};
      (data || []).forEach(p => { if (p.user_id) map[p.user_id] = p; });
      setProfileMap(map);
    } catch (e) { console.error(e); }
  };

  const loadMessages = async () => {
    try {
      const data = await base44.entities.DirectMessage.filter({}, 'created_date', 200);
      const sent = (data || []).filter(m => m.created_by_id === user.id && !m.team_id);
      const received = (data || []).filter(m => m.recipient_id === user.id && !m.team_id);
      const partnerIds = new Set([...sent.map(m => m.recipient_id), ...received.map(m => m.created_by_id)]);
      setConversations([...partnerIds]);
    } catch (e) { console.error(e); }
  };

  const loadConversation = async (partnerId) => {
    try {
      const data = await base44.entities.DirectMessage.filter({}, 'created_date', 200);
      const convo = (data || []).filter(m => !m.team_id && ((m.created_by_id === user.id && m.recipient_id === partnerId) || (m.recipient_id === user.id && m.created_by_id === partnerId)));
      setMessages(convo);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    try {
      const msg = await base44.entities.DirectMessage.create({ recipient_id: selectedUser, content: newMessage });
      setMessages([...messages, msg]);
      setNewMessage('');
      if (!conversations.includes(selectedUser)) setConversations([...conversations, selectedUser]);
    } catch (e) { console.error(e); }
  };

  const startConversation = (userId) => {
    setSelectedUser(userId);
    setSearchQuery(''); setSearchResults([]);
    if (!conversations.includes(userId)) setConversations([...conversations, userId]);
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults((allProfiles || []).filter(p => (p.display_name || '').toLowerCase().includes(q) && p.user_id !== user.id).slice(0, 5));
  }, [searchQuery, allProfiles, user]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2"><MessageSquare size={24} className="text-violet-400" /> {t('msg_title')}</h1>

      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-3 mb-4 relative">
        <label className="text-xs text-zinc-500 flex items-center gap-1 mb-2"><Search size={12} /> {t('msg_search_user')}</label>
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('msg_search_placeholder')} className="bg-zinc-800 border-zinc-700 text-sm" />
        {searchResults.length > 0 && (
          <div className="absolute left-3 right-3 mt-2 bg-zinc-800 rounded-lg border border-zinc-700 shadow-lg z-10 max-w-md">
            {searchResults.map(p => (
              <button key={p.user_id} onClick={() => startConversation(p.user_id)} className="w-full flex items-center gap-2 p-2.5 hover:bg-violet-600/10 transition text-left border-b border-zinc-700/50 last:border-0">
                {p.avatar ? <img src={p.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">{(p.display_name || '?').charAt(0)}</div>}
                <span className="text-sm text-zinc-200 flex-1">{p.display_name || t('detail_unknown')}</span>
                <UserPlus size={14} className="text-violet-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-y-auto">
          {conversations.length === 0 ? <p className="text-xs text-zinc-600 text-center mt-8">{t('msg_no_conversation')}</p>
            : conversations.map(partnerId => {
              const profile = profileMap[partnerId];
              const name = profile?.display_name || partnerId.slice(0, 8);
              return (
                <button key={partnerId} onClick={() => setSelectedUser(partnerId)} className={`w-full flex items-center gap-2 p-3 text-left transition border-b border-zinc-800/50 ${selectedUser === partnerId ? 'bg-violet-600/10' : 'hover:bg-zinc-800/50'}`}>
                  {profile?.avatar ? <img src={profile.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{(name[0] || '?').toUpperCase()}</div>}
                  <span className="text-sm text-zinc-300 truncate">{name}</span>
                </button>
              );
            })}
        </div>

        <div className="md:col-span-2 bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-col">
          {selectedUser ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? <p className="text-xs text-zinc-600 text-center mt-8">{t('msg_no_messages')}</p>
                  : messages.map(msg => {
                    const isMe = msg.created_by_id === user.id;
                    const senderName = profileMap[msg.created_by_id]?.display_name || t('detail_unknown');
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && <Link to={`/user/${msg.created_by_id}`} className="text-xs text-zinc-500 mb-0.5 ml-1 hover:text-violet-400">{senderName}</Link>}
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-200'}`}>{msg.content}</div>
                        <span className="text-xs text-zinc-600 mt-0.5 mx-1">{formatTime(msg.created_date)}</span>
                      </div>
                    );
                  })}
                <div ref={msgEndRef} />
              </div>
              <div className="p-3 border-t border-zinc-800 flex gap-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={t('msg_placeholder')} className="bg-zinc-800 border-zinc-700 text-sm" />
                <Button size="sm" onClick={sendMessage} className="bg-violet-600 hover:bg-violet-500"><Send size={14} /></Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-600">
              <div className="text-center"><MessageSquare size={32} className="mx-auto mb-2 opacity-40" /><p className="text-sm">{t('msg_no_conversation')}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}