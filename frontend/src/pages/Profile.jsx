import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore, useToastStore } from '../store';

export default function Profile() {
  const { id }                   = useParams();
  const { user: me, updateUser } = useAuthStore();
  const { add }                  = useToastStore();
  const navigate                 = useNavigate();

  const [profile,   setProfile]   = useState(null);
  const [books,     setBooks]     = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const [coverUploading,  setCoverUploading]  = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const isOwn = me?._id === id;

  useEffect(() => {
    setLoading(true);
    setActiveTab('All');
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/users/${id}/collection`),
    ]).then(([p, c]) => {
      setProfile(p.data.user);
      setFollowing(p.data.isFollowing);
      setBooks(c.data.collections.map(x => x.book).filter(Boolean));
    }).finally(() => setLoading(false));
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

  const uploadCover = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    const fd = new FormData();
    fd.append('coverImage', file);
    api.put('/users/me/cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(({ data }) => {
        setProfile(p => ({ ...p, coverImage: data.coverImage }));
        updateUser({ coverImage: data.coverImage });
        add('Cover updated!');
      })
      .catch(err => add(err.response?.data?.message || 'Failed', 'error'))
      .finally(() => setCoverUploading(false));
  };

  const uploadAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    api.put('/users/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(({ data }) => {
        setProfile(p => ({ ...p, avatar: data.user.avatar }));
        updateUser({ avatar: data.user.avatar });
        add('Avatar updated!');
      })
      .catch(err => add(err.response?.data?.message || 'Failed', 'error'))
      .finally(() => setAvatarUploading(false));
  };

  const filtered   = activeTab === 'All' ? books : books.filter(b => b.genre === activeTab);
  const userGenres = [...new Set(books.map(b => b.genre).filter(Boolean))];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--text-3)' }}>
      User not found.
    </div>
  );

  const initials = (profile.displayName || profile.username || '?').slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        .profile-cover {
          width: 100%; height: 180px;
          background: linear-gradient(135deg, var(--blue-fill), var(--blue-200));
          position: relative; overflow: hidden;
        }
        @media(min-width:768px) { .profile-cover { height: 240px; } }
        .profile-cover > img { width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; }

        .cover-label {
          position: absolute; bottom: 10px; right: 12px;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px;
          background: rgba(0,0,0,0.55); color: #fff;
          border-radius: 20px; font-size: 12px; font-weight: 500;
          cursor: pointer; z-index: 5; transition: background 150ms;
          user-select: none; overflow: hidden;
        }
        .cover-label:hover { background: rgba(0,0,0,0.75); }
        .cover-label input {
          position: absolute; inset: 0;
          opacity: 0; cursor: pointer;
          width: 100%; height: 100%;
          font-size: 0;
        }

        .profile-avatar-row {
          display: flex; align-items: flex-end;
          padding: 0 16px; margin-top: -44px;
          position: relative; z-index: 3; gap: 14px;
        }
        @media(min-width:768px) { .profile-avatar-row { margin-top:-55px; padding:0 32px; } }

        .profile-name-wrap {
          padding-top: 50px;
          padding-bottom: 6px;
          min-width: 0;
        }
        @media(min-width:768px) { .profile-name-wrap { padding-top: 62px; } }

        .profile-avatar {
          width: 88px; height: 88px; border-radius: 50%;
          border: 3px solid var(--bg); overflow: hidden;
          background: var(--blue-fill);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 700; color: var(--blue-text);
          position: relative; flex-shrink: 0;
        }
        @media(min-width:768px) { .profile-avatar { width:110px; height:110px; font-size:32px; } }

        label.profile-avatar { cursor: pointer; }
        label.profile-avatar input {
          position: absolute; inset: 0;
          opacity: 0; cursor: pointer;
          width: 100%; height: 100%;
          font-size: 0;
        }
        .av-overlay {
          position: absolute; inset: 0; border-radius: 50%;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 150ms; pointer-events: none;
          font-size: 22px;
        }
        label.profile-avatar:hover .av-overlay { opacity: 1; }

        .profile-body { padding: 0 16px 16px; }
        @media(min-width:768px) { .profile-body { padding: 0 32px 24px; } }

        .profile-tabs {
          display: flex; gap: 8px; overflow-x: auto;
          padding: 0 16px 8px; margin-bottom: 16px;
          scrollbar-width: none; border-bottom: 0.5px solid var(--border);
        }
        .profile-tabs::-webkit-scrollbar { display: none; }
        @media(min-width:768px) { .profile-tabs { padding: 0 32px 8px; } }

        .profile-books { padding: 0 16px 32px; }
        @media(min-width:768px) { .profile-books { padding: 0 32px 48px; } }

        .pb-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
        @media(min-width:480px)  { .pb-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; } }
        @media(min-width:768px)  { .pb-grid { grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; } }
        @media(min-width:1024px) { .pb-grid { grid-template-columns:repeat(5,minmax(0,1fr)); gap:18px; } }

        .pb-card { width:100%; min-width:0; background:var(--surface); border:0.5px solid var(--border); border-radius:8px; overflow:hidden; display:block; transition:transform 150ms,border-color 150ms; text-decoration:none; }
        .pb-card:hover { transform:translateY(-2px); border-color:var(--blue-400); }
        .pb-cover { width:100%; padding-top:150%; position:relative; background:var(--blue-fill); overflow:hidden; }
        .pb-cover img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; display:block; }
        .pb-cover .pb-nc { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:28px; }
        .pb-info { padding:7px 8px 10px; min-width:0; display:flex; flex-direction:column; gap:3px; }
        .pb-title  { font-size:12px; font-weight:700; color:var(--text-1); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .pb-author { font-size:11px; color:var(--text-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', overflowX: 'hidden' }}>

        {/* ── Cover ── */}
        <div className="profile-cover">
          {profile.coverImage && <img src={profile.coverImage} alt="cover" />}
          {isOwn && (
            <label className="cover-label">
              {coverUploading ? 'Uploading…' : 'Edit cover'}
              <input type="file" accept="image/*" disabled={coverUploading} onChange={uploadCover} />
            </label>
          )}
        </div>

        {/* ── Avatar ── */}
        <div className="profile-avatar-row">
          {isOwn ? (
            <label className="profile-avatar">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.username}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', pointerEvents:'none' }} />
                : <span style={{ pointerEvents: 'none' }}>{initials}</span>
              }
              <div className="av-overlay">📷</div>
              <input type="file" accept="image/*" disabled={avatarUploading} onChange={uploadAvatar} />
            </label>
          ) : (
            <div className="profile-avatar">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.username}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                : <span>{initials}</span>
              }
            </div>
          )}

          <div className="profile-name-wrap">
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>
              {profile.displayName || profile.username}
            </div>
            {profile.displayName && (
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>@{profile.username}</div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>
              {profile.collectedCount || 0} books
            </div>
          </div>
        </div>

        {/* ── Stats + Bio + Actions ── */}
        <div className="profile-body">
          <div style={{ display: 'flex', gap: 24, marginBottom: 14, marginTop: 12 }}>
            {[
              { v: profile.collectedCount || 0, l: 'Books' },
              { v: profile.followersCount  || 0, l: 'Followers' },
              { v: profile.followingCount  || 0, l: 'Following' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l}</div>
              </div>
            ))}
          </div>

          {profile.bio && (
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, maxWidth: 480 }}>
              {profile.bio}
            </p>
          )}

          {!isOwn && me && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              <button onClick={toggleFollow} style={{
                flex: 1, padding: '10px 0', borderRadius: 'var(--r-xl)', fontFamily: 'inherit',
                border: following ? '0.5px solid var(--border-strong)' : 'none',
                background: following ? 'transparent' : 'var(--blue-btn)',
                color: following ? 'var(--text-2)' : '#fff',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
                {following ? 'Following' : 'Follow'}
              </button>
              <button onClick={startChat} style={{
                flex: 1, padding: '10px 0', borderRadius: 'var(--r-xl)', fontFamily: 'inherit',
                border: '1px solid var(--blue-btn)', background: 'transparent',
                color: 'var(--blue-btn)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
                Message
              </button>
            </div>
          )}

          {isOwn && (
            <Link to="/settings" style={{
              display: 'inline-block', padding: '9px 24px',
              border: '0.5px solid var(--border-strong)', borderRadius: 'var(--r-xl)',
              color: 'var(--text-2)', fontSize: 14, fontWeight: 500,
            }}>
              Edit profile
            </Link>
          )}
        </div>

        {/* ── Genre tabs ── */}
        <div className="profile-tabs">
          {['All', ...userGenres].map(g => (
            <button key={g} onClick={() => setActiveTab(g)} style={{
              flexShrink: 0, padding: '7px 16px', borderRadius: 20, fontFamily: 'inherit',
              border: activeTab === g ? 'none' : '0.5px solid var(--border)',
              cursor: 'pointer', whiteSpace: 'nowrap',
              background: activeTab === g ? 'var(--blue-btn)' : 'var(--surface)',
              color: activeTab === g ? '#fff' : 'var(--text-2)',
              fontSize: 13, fontWeight: activeTab === g ? 600 : 400,
            }}>{g}</button>
          ))}
        </div>

        {/* ── Book grid ── */}
        <div className="profile-books">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {activeTab === 'All'
                  ? isOwn ? 'Start collecting books!' : `${profile.displayName || profile.username} hasn't collected any books yet.`
                  : `No ${activeTab} books collected`}
              </div>
              {isOwn && activeTab === 'All' && (
                <Link to="/" style={{
                  display: 'inline-block', marginTop: 14, padding: '10px 24px',
                  background: 'var(--blue-btn)', color: '#fff',
                  borderRadius: 'var(--r-xl)', fontWeight: 600, fontSize: 14,
                }}>Browse books</Link>
              )}
            </div>
          ) : (
            <div className="pb-grid">
              {filtered.map(b => (
                <Link key={b._id} to={`/books/${b._id}`} className="pb-card">
                  <div className="pb-cover">
                    {b.coverImage
                      ? <img src={b.coverImage} alt={b.title} loading="lazy" />
                      : <div className="pb-nc">📖</div>
                    }
                  </div>
                  <div className="pb-info">
                    <div className="pb-title">{b.title}</div>
                    <div className="pb-author">{b.author?.name || 'Unknown'}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
