import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore, useToastStore, useOnlineStore } from '../store';
import { getSocket } from '../lib/socket';
import { Avatar, Button, Spinner, EmptyState, Input } from '../components/ui';
import BookCard from '../components/BookCard';

// ─── Profile Page ─────────────────────────────────────────────
export function ProfilePage() {
  const { id }          = useParams();
  const { user: me }    = useAuthStore();
  const { add }         = useToastStore();
  const navigate        = useNavigate();
  const [profile, setProfile] = useState(null);
  const [books,   setBooks]   = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOwn = me?._id === id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profRes, colRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/users/${id}/collection`),
        ]);
        setProfile(profRes.data.user);
        setFollowing(profRes.data.isFollowing);
        setBooks(colRes.data.collections.map(c => c.book).filter(Boolean));
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const toggleFollow = async () => {
    if (!me) return navigate('/login');
    const { data } = await api.post(`/users/${id}/follow`);
    setFollowing(data.following);
    setProfile(p => ({ ...p, followersCount: p.followersCount + (data.following ? 1 : -1) }));
    add(data.message);
  };

  const startChat = async () => {
    if (!me) return navigate('/login');
    const { data } = await api.post('/chat/conversations', { userId: id });
    navigate(`/chat/${data.conversation._id}`);
  };

  if (loading) return <div className="container page-padding"><Spinner /></div>;
  if (!profile) return <div className="container page-padding"><p>User not found.</p></div>;

  return (
    <div className="container page-padding">
      {/* Profile header */}
      <div className="card" style={{ marginBottom: 28, padding: 28 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar user={profile} size="xl" />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 className="h1" style={{ marginBottom: 4 }}>{profile.username}</h1>
            {profile.bio && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12, maxWidth: 480 }}>{profile.bio}</p>}

            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              {[
                { val: profile.collectedCount || 0, label: 'Books' },
                { val: profile.followersCount   || 0, label: 'Followers' },
                { val: profile.followingCount   || 0, label: 'Following' },
              ].map(({ val, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>

            {!isOwn && me && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant={following ? 'ghost' : 'primary'} size="sm" onClick={toggleFollow}>
                  {following ? 'Following' : 'Follow'}
                </Button>
                <Button variant="secondary" size="sm" onClick={startChat}>
                  Message
                </Button>
              </div>
            )}
            {isOwn && (
              <Link to="/settings">
                <Button variant="ghost" size="sm">Edit profile</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Collection */}
      <h2 className="h2" style={{ marginBottom: 16 }}>Collection</h2>
      {books.length === 0
        ? <EmptyState icon="📚" title="No books collected yet"
            description={isOwn ? "Start collecting books!" : `${profile.username} hasn't collected any books yet.`}
            action={isOwn ? <Link to="/"><Button variant="primary">Browse books</Button></Link> : null}
          />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 14 }}>
            {books.map(b => <BookCard key={b._id} book={b} />)}
          </div>
        )
      }
    </div>
  );
}

// ─── Readers Page ─────────────────────────────────────────────
export function ReadersPage() {
  const { user: me }    = useAuthStore();
  const { add }         = useToastStore();
  const { onlineUsers } = useOnlineStore();
  const [users,   setUsers]   = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/users', { params: { search, page, limit: 20 } });
        setUsers(data.users);
        setTotal(data.total);
      } finally { setLoading(false); }
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, page]);

  const toggleFollow = async (userId, currentlyFollowing) => {
    if (!me) return;
    await api.post(`/users/${userId}/follow`);
    setUsers(us => us.map(u => u._id === userId
      ? { ...u, _following: !currentlyFollowing, followersCount: u.followersCount + (currentlyFollowing ? -1 : 1) }
      : u
    ));
  };

  return (
    <div className="container page-padding">
      <h1 className="h1" style={{ marginBottom: 6 }}>Readers</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{total} readers in the community</p>

      <Input placeholder="Search readers…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 340, marginBottom: 24 }} />

      {loading ? <Spinner /> : users.length === 0
        ? <EmptyState icon="👤" title="No readers found" />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {users.filter(u => u._id !== me?._id).map(u => (
              <div key={u._id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0', borderBottom: '0.5px solid var(--border)',
              }}>
                <Link to={`/profile/${u._id}`} style={{ position: 'relative' }}>
                  <Avatar user={u} size="md" />
                  {onlineUsers.has(u._id) && (
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, background: 'var(--green-400)', borderRadius: '50%', border: '2px solid var(--bg)' }} />
                  )}
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/profile/${u._id}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{u.username}</Link>
                  {u.bio && <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{u.bio}</p>}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {u.collectedCount || 0} books · {u.followersCount || 0} followers
                  </div>
                </div>
                {me && (
                  <Button
                    variant={u._following ? 'ghost' : 'secondary'}
                    size="sm"
                    onClick={() => toggleFollow(u._id, u._following)}
                  >
                    {u._following ? 'Following' : 'Follow'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── Chat Page ────────────────────────────────────────────────
export function ChatPage() {
  const { conversationId } = useParams();
  const { user: me }       = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [messages,      setMessages]      = useState([]);
  const [activeConv,    setActiveConv]    = useState(null);
  const [text,          setText]          = useState('');
  const [loading,       setLoading]       = useState(true);
  const messagesEndRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    api.get('/chat/conversations').then(({ data }) => {
      setConversations(data.conversations);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const conv = conversations.find(c => c._id === conversationId);
    if (conv) setActiveConv(conv);

    api.get(`/chat/conversations/${conversationId}/messages`).then(({ data }) => {
      setMessages(data.messages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    socket?.emit('conversation:join', conversationId);
    return () => socket?.emit('conversation:leave', conversationId);
  }, [conversationId, conversations]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ message }) => {
      if (message.conversation === conversationId) {
        setMessages(prev => [...prev, message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
      setConversations(prev => prev.map(c =>
        c._id === message.conversation ? { ...c, lastMessage: message } : c
      ));
    };
    socket.on('message:new', handler);
    return () => socket.off('message:new', handler);
  }, [socket, conversationId]);

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!text.trim() || !conversationId) return;
    socket?.emit('message:send', { conversationId, text: text.trim() });
    setText('');
  };

  const getOtherUser = (conv) => conv?.participants?.find(p => p._id !== me?._id);

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, border: '0.5px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', height: 'calc(100vh - 120px)' }}>

        {/* Conversation list */}
        <div style={{ borderRight: '0.5px solid var(--border)', overflowY: 'auto', background: 'var(--surface)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--border)', fontWeight: 600, fontSize: 15 }}>Messages</div>
          {loading ? <div style={{ padding: 20 }}><Spinner size={20} /></div>
            : conversations.length === 0
            ? <div style={{ padding: 20, fontSize: 13, color: 'var(--text-muted)' }}>No conversations yet</div>
            : conversations.map(conv => {
              const other = getOtherUser(conv);
              const isActive = conv._id === conversationId;
              return (
                <Link key={conv._id} to={`/chat/${conv._id}`} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid var(--border)', background: isActive ? 'var(--blue-fill)' : 'transparent', textDecoration: 'none' }}>
                  <Avatar user={other} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{other?.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.lastMessage?.text || 'No messages yet'}
                    </div>
                  </div>
                </Link>
              );
            })
          }
        </div>

        {/* Message area */}
        {conversationId ? (
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
            {/* Header */}
            <div style={{ padding: '12px 18px', borderBottom: '0.5px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 10 }}>
              {activeConv && <Avatar user={getOtherUser(activeConv)} size="sm" />}
              <div style={{ fontWeight: 600, fontSize: 14 }}>{getOtherUser(activeConv)?.username || '…'}</div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map(msg => {
                const isMine = msg.sender?._id === me?._id || msg.sender === me?._id;
                return (
                  <div key={msg._id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '68%', padding: '9px 13px',
                      background: isMine ? 'var(--blue-btn)' : 'var(--surface)',
                      color: isMine ? '#fff' : 'var(--text-primary)',
                      borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      fontSize: 14, lineHeight: 1.5,
                      border: isMine ? 'none' : '0.5px solid var(--border)',
                    }}>
                      {msg.text}
                      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: 'right' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMsg} style={{ padding: '12px 18px', borderTop: '0.5px solid var(--border)', display: 'flex', gap: 8, background: 'var(--surface)' }}>
              <input
                className="input"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message…"
                style={{ flex: 1 }}
              />
              <Button variant="primary" type="submit" disabled={!text.trim()}>Send</Button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
