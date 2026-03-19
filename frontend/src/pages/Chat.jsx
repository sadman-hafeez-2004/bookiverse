import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuthStore } from '../store';
import { Av, Spinner } from '../components/ui';

export default function Chat() {
  const { conversationId } = useParams();
  const { user: me }       = useAuthStore();
  const navigate           = useNavigate();

  const [convs,    setConvs]    = useState([]);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const bottomRef  = useRef();
  const inputRef   = useRef();

  const scrollBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, []);

  // Load conversations
  useEffect(() => {
    api.get('/chat/conversations').then(({ data }) => {
      setConvs(data.conversations);
      setLoading(false);
    });
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversationId) return;
    api.get(`/chat/conversations/${conversationId}/messages`).then(({ data }) => {
      setMessages(data.messages);
      scrollBottom();
    });

    const socket = getSocket();
    if (!socket) return;
    socket.emit('conversation:join', conversationId);
    return () => socket.emit('conversation:leave', conversationId);
  }, [conversationId]);

  // Listen for new messages via Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = ({ message }) => {
      // Only add if it belongs to current conversation
      if (message.conversation === conversationId || message.conversation?._id === conversationId) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        scrollBottom();
      }
      // Update conversation list preview
      setConvs(prev => prev.map(c =>
        c._id === (message.conversation?._id || message.conversation)
          ? { ...c, lastMessage: message }
          : c
      ));
    };

    socket.on('message:new', onNewMessage);
    return () => socket.off('message:new', onNewMessage);
  }, [conversationId, scrollBottom]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !conversationId || sending) return;

    setSending(true);
    setText('');

    const socket = getSocket();
    if (socket?.connected) {
      // Send via socket
      socket.emit('message:send', { conversationId, text: trimmed }, (res) => {
        if (!res?.success) {
          // Fallback to REST if socket fails
          api.post(`/chat/conversations/${conversationId}/messages`, { text: trimmed })
            .then(({ data }) => {
              setMessages(prev => [...prev, data.message]);
              scrollBottom();
            });
        }
        setSending(false);
      });
    } else {
      // No socket — use REST
      try {
        const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, { text: trimmed });
        setMessages(prev => [...prev, data.message]);
        scrollBottom();
      } finally { setSending(false); }
    }
    inputRef.current?.focus();
  };

  const getOther = (conv) => conv?.participants?.find(p => p._id !== me?._id);

  const activeConv = convs.find(c => c._id === conversationId);
  const otherUser  = activeConv ? getOther(activeConv) : null;

  if (loading) return <Spinner />;

  return (
    <div style={{ height: 'calc(100vh - var(--nav-h))', display: 'flex', overflow: 'hidden' }}>

      {/* ── Conversation list (left) ── */}
      <div style={{
        width: conversationId ? '0' : '100%',
        minWidth: conversationId ? 0 : '100%',
        borderRight: '0.5px solid var(--border)',
        background: 'var(--surface)',
        overflowY: 'auto',
        flexShrink: 0,
        transition: 'all 200ms',
      }} className="conv-list">
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--border)', fontWeight: 600, fontSize: 15, position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
          Messages
        </div>

        {convs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No conversations yet.<br />
            <Link to="/readers" style={{ color: 'var(--blue-text)', marginTop: 8, display: 'inline-block' }}>Find readers to message</Link>
          </div>
        ) : convs.map(conv => {
          const other    = getOther(conv);
          const isActive = conv._id === conversationId;
          return (
            <Link key={conv._id} to={`/chat/${conv._id}`} style={{
              display: 'flex', gap: 10, alignItems: 'center',
              padding: '12px 16px', borderBottom: '0.5px solid var(--border)',
              background: isActive ? 'var(--blue-fill)' : 'transparent',
            }}>
              <Av user={other} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{other?.username}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.lastMessage?.text || 'No messages yet'}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Message area (right) ── */}
      {conversationId && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderBottom: '0.5px solid var(--border)', background: 'var(--surface)',
            position: 'sticky', top: 0, zIndex: 1,
          }}>
            <button onClick={() => navigate('/chat')} style={{
              background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
              color: 'var(--text-2)', padding: '0 4px 0 0',
            }}>←</button>
            {otherUser && (
              <>
                <Av user={otherUser} size="sm" />
                <Link to={`/profile/${otherUser._id}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>
                  {otherUser.username}
                </Link>
              </>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, margin: 'auto' }}>
                Say hello to {otherUser?.username}!
              </div>
            )}
            {messages.map((msg, i) => {
              const senderId = msg.sender?._id || msg.sender;
              const isMine   = senderId === me?._id;
              return (
                <div key={msg._id || i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%',
                    padding: '9px 13px',
                    background: isMine ? 'var(--blue-btn)' : 'var(--surface)',
                    color: isMine ? '#fff' : 'var(--text-1)',
                    borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: 14, lineHeight: 1.5,
                    border: isMine ? 'none' : '0.5px solid var(--border)',
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                    <div style={{ fontSize: 10, opacity: 0.65, marginTop: 3, textAlign: 'right' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{
            display: 'flex', gap: 8, padding: '10px 14px',
            borderTop: '0.5px solid var(--border)', background: 'var(--surface)',
          }}>
            <input
              ref={inputRef}
              className="input"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message…"
              style={{ flex: 1 }}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={!text.trim() || sending}
              style={{ flexShrink: 0 }}>
              {sending ? '…' : 'Send'}
            </button>
          </form>
        </div>
      )}

      {/* Desktop: show both panels side by side */}
      <style>{`
        @media (min-width: 640px) {
          .conv-list {
            width: 280px !important;
            min-width: 280px !important;
          }
        }
      `}</style>
    </div>
  );
}
