import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore, useToastStore } from '../store';
import { Spinner, Stars } from '../components/ui';

const GENRES = ['Fiction','Non-Fiction','Science Fiction','Fantasy','Mystery',
  'Thriller','Romance','Horror','Biography','History','Self-Help','Science','Philosophy'];

// ── Upload icon SVG ───────────────────────────────────────────
const UploadIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

export default function Profile() {
  const { id }       = useParams();
  const { user: me, updateUser } = useAuthStore();
  const { add }      = useToastStore();
  const navigate     = useNavigate();

  const [profile,   setProfile]   = useState(null);
  const [books,     setBooks]     = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const coverRef   = useRef();
  const avatarRef  = useRef();
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

  // Upload cover image
  const uploadCover = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('coverImage', file);
      const { data } = await api.put('/users/me/cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(p => ({ ...p, coverImage: data.coverImage }));
      updateUser({ coverImage: data.coverImage });
      add('Cover updated!');
    } catch {
      add('Failed to upload cover', 'error');
    } finally { setCoverUploading(false); }
  };

  // Upload avatar
  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await api.put('/users/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(p => ({ ...p, avatar: data.user.avatar }));
      updateUser({ avatar: data.user.avatar });
      add('Avatar updated!');
    } catch {
      add('Failed to upload avatar', 'error');
    } finally { setAvatarUploading(false); }
  };

  // Filter books by active tab
  const filtered = activeTab === 'All'
    ? books
    : books.filter(b => b.genre === activeTab);

  // Only show genres that user has books in
  const userGenres = [...new Set(books.map(b => b.genre).filter(Boolean))];

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
      <div className="spinner" style={{ width:28, height:28 }} />
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign:'center', padding:'60px 16px', color:'var(--text-3)' }}>
      User not found.
    </div>
  );

  const initials = profile.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <>
      <style>{`
        /* Cover wrapper — contains cover image only, no padding */
        .profile-cover-wrap {
          position: relative;
          width: 100%;
        }

        /* Cover image */
        .profile-cover {
          width: 100%;
          height: 180px;
          background: linear-gradient(135deg, var(--blue-fill), var(--blue-200));
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 768px) { .profile-cover { height: 240px; } }

        /* Cover upload button — bottom right of cover */
        .cover-upload-btn {
          position: absolute;
          bottom: 10px;
          right: 12px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          background: rgba(0,0,0,0.55);
          color: #fff;
          border: none;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 150ms;
          z-index: 2;
        }
        .cover-upload-btn:hover { background: rgba(0,0,0,0.75); }

        /* Avatar row — sits BELOW cover, avatar pulled UP with negative margin */
        .profile-avatar-row {
          display: flex;
          align-items: flex-end;
          padding: 0 20px;
          margin-top: -44px; /* pull up by half of 88px avatar height */
          position: relative;
          z-index: 3;
          gap: 14px;
        }
        @media (min-width: 768px) {
          .profile-avatar-row {
            margin-top: -55px; /* half of 110px */
            padding: 0 32px;
          }
        }

        /* Avatar circle */
        .profile-avatar {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          border: 3px solid var(--bg);
          overflow: hidden;
          background: var(--blue-fill);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 700;
          color: var(--blue-text);
          position: relative;
          flex-shrink: 0;
          cursor: pointer;
        }
        @media (min-width: 768px) {
          .profile-avatar { width: 110px; height: 110px; font-size: 32px; }
        }

        /* Avatar upload overlay */
        .avatar-upload-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 150ms;
        }
        .profile-avatar:hover .avatar-upload-overlay { opacity: 1; }

        /* Name + book count — sits beside avatar, with top margin so it clears cover */
        .profile-name-wrap {
          padding-bottom: 6px;
          padding-top: 48px; /* push name below cover bottom line */
          min-width: 0;
        }
        @media (min-width: 768px) {
          .profile-name-wrap { padding-top: 62px; }
        }

        /* Page wrapper */
        .profile-wrap {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        /* Info + buttons section */
        .profile-body {
          padding: 0 16px 16px;
        }
        @media (min-width: 640px)  { .profile-body { padding: 0 20px 20px; } }
        @media (min-width: 1024px) { .profile-body { padding: 0 32px 24px; } }

        /* Category tabs */
        .profile-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 0 16px 8px;
          margin-bottom: 16px;
          scrollbar-width: none;
          border-bottom: 0.5px solid var(--border);
          -webkit-overflow-scrolling: touch;
        }
        .profile-tabs::-webkit-scrollbar { display: none; }
        @media (min-width: 640px)  { .profile-tabs { padding: 0 20px 8px; } }
        @media (min-width: 1024px) { .profile-tabs { padding: 0 32px 8px; } }

        /* Book grid — same as home page */
        .profile-books {
          padding: 0 16px 32px;
        }
        @media (min-width: 640px)  { .profile-books { padding: 0 20px 40px; } }
        @media (min-width: 1024px) { .profile-books { padding: 0 32px 48px; } }

        .pb-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (min-width: 480px)  { .pb-grid { grid-template-columns: repeat(3, minmax(0,1fr)); gap:14px; } }
        @media (min-width: 768px)  { .pb-grid { grid-template-columns: repeat(4, minmax(0,1fr)); gap:16px; } }
        @media (min-width: 1024px) { .pb-grid { grid-template-columns: repeat(5, minmax(0,1fr)); gap:18px; } }

        .pb-card {
          width: 100%; min-width: 0;
          background: var(--surface);
          border: 0.5px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          display: flex; flex-direction: column;
          transition: transform 150ms, border-color 150ms;
          text-decoration: none;
        }
        .pb-card:hover { transform: translateY(-2px); border-color: var(--blue-400); }

        .pb-cover {
          width: 100%;
          padding-top: 150%;
          position: relative;
          background: var(--blue-fill);
          overflow: hidden;
          flex-shrink: 0;
        }
        .pb-cover img {
          position: absolute; top:0; left:0;
          width:100%; height:100%;
          object-fit: cover; display: block;
        }
        .pb-cover .pb-nocover {
          position: absolute; inset:0;
          display:flex; align-items:center; justify-content:center;
          font-size: 24px;
        }
        .pb-info {
          padding: 7px 8px 10px;
          flex:1; min-width:0;
          display:flex; flex-direction:column; gap:3px;
        }
        .pb-title  { font-size:12px; font-weight:700; color:var(--text-1); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .pb-author { font-size:11px; color:var(--text-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      `}</style>

      <div className="profile-wrap">

        {/* ── Cover image ── */}
        <div className="profile-cover-wrap">
          <div className="profile-cover">
            {profile.coverImage && (
              <img src={profile.coverImage} alt="cover"
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            )}
            {isOwn && (
              <>
                <input ref={coverRef} type="file" accept="image/*" style={{ display:'none' }} onChange={uploadCover} />
                <button className="cover-upload-btn" onClick={() => coverRef.current.click()} disabled={coverUploading}>
                  <UploadIcon />
                  {coverUploading ? 'Uploading…' : 'Edit cover'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Avatar row — negative margin pulls avatar UP over cover ── */}
        <div className="profile-avatar-row">
          {/* Avatar circle */}
          <div className="profile-avatar" onClick={() => isOwn && avatarRef.current.click()}>
            {profile.avatar
              ? <img src={profile.avatar} alt={profile.username}
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              : <span>{initials}</span>
            }
            {isOwn && (
              <div className="avatar-upload-overlay"><UploadIcon /></div>
            )}
          </div>
          {isOwn && (
            <input ref={avatarRef} type="file" accept="image/*" style={{ display:'none' }} onChange={uploadAvatar} />
          )}

          {/* Name + book count — right of avatar, pushed down so it sits below cover */}
          <div className="profile-name-wrap">
            <div style={{ fontSize:18, fontWeight:700, color:'var(--text-1)', lineHeight:1.2 }}>{profile.username}</div>
            <div style={{ fontSize:13, color:'var(--text-3)', marginTop:3 }}>{profile.collectedCount||0} books</div>
          </div>
        </div>

        {/* ── Profile body ── */}
        <div className="profile-body">

          {/* Stats row */}
          <div style={{ display:'flex', gap:24, marginBottom:14 }}>
            {[
              { v: profile.collectedCount||0, l:'Books'     },
              { v: profile.followersCount ||0, l:'Followers' },
              { v: profile.followingCount ||0, l:'Following' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--text-1)' }}>{v}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:14, maxWidth:480 }}>{profile.bio}</p>
          )}

          {/* Follow + Message — visitor only */}
          {!isOwn && me && (
            <div style={{ display:'flex', gap:10, marginBottom:4 }}>
              <button onClick={toggleFollow} style={{
                flex:1, padding:'10px 0', borderRadius:'var(--r-xl)',
                border: following ? '0.5px solid var(--border-strong)' : 'none',
                background: following ? 'transparent' : 'var(--blue-btn)',
                color: following ? 'var(--text-2)' : '#fff',
                fontWeight:600, fontSize:14, cursor:'pointer',
                transition:'all 150ms',
              }}>
                {following ? 'Following' : 'Follow'}
              </button>
              <button onClick={startChat} style={{
                flex:1, padding:'10px 0', borderRadius:'var(--r-xl)',
                border:'1px solid var(--blue-btn)',
                background:'transparent', color:'var(--blue-btn)',
                fontWeight:600, fontSize:14, cursor:'pointer',
                transition:'all 150ms',
              }}>
                Message
              </button>
            </div>
          )}

          {/* Edit profile — own profile only */}
          {isOwn && (
            <Link to="/settings" style={{
              display:'inline-block', padding:'9px 24px',
              border:'0.5px solid var(--border-strong)',
              borderRadius:'var(--r-xl)',
              color:'var(--text-2)', fontSize:14, fontWeight:500,
              transition:'all 150ms',
            }}>
              Edit profile
            </Link>
          )}
        </div>

        {/* ── Category tabs — same as home page ── */}
        <div className="profile-tabs">
          {['All', ...userGenres].map(g => (
            <button key={g} onClick={() => setActiveTab(g)} style={{
              flexShrink:0, padding:'7px 16px', borderRadius:20,
              border: activeTab===g ? 'none' : '0.5px solid var(--border)',
              cursor:'pointer', whiteSpace:'nowrap', transition:'all 150ms',
              background: activeTab===g ? 'var(--blue-btn)' : 'var(--surface)',
              color: activeTab===g ? '#fff' : 'var(--text-2)',
              fontSize:13, fontWeight: activeTab===g ? 600 : 400,
            }}>{g}</button>
          ))}
        </div>

        {/* ── Book grid — same style as home page ── */}
        <div className="profile-books">
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text-3)' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📚</div>
              <div style={{ fontWeight:600, fontSize:15 }}>
                {activeTab === 'All'
                  ? isOwn ? 'Start collecting books!' : `${profile.username} hasn't collected any books yet.`
                  : `No ${activeTab} books collected`
                }
              </div>
              {isOwn && activeTab === 'All' && (
                <Link to="/" style={{
                  display:'inline-block', marginTop:14, padding:'10px 24px',
                  background:'var(--blue-btn)', color:'#fff',
                  borderRadius:'var(--r-xl)', fontWeight:600, fontSize:14,
                }}>
                  Browse books
                </Link>
              )}
            </div>
          ) : (
            <div className="pb-grid">
              {filtered.map(b => (
                <Link key={b._id} to={`/books/${b._id}`} className="pb-card">
                  <div className="pb-cover">
                    {b.coverImage
                      ? <img src={b.coverImage} alt={b.title} loading="lazy" />
                      : <div className="pb-nocover">📖</div>
                    }
                  </div>
                  <div className="pb-info">
                    <div className="pb-title">{b.title}</div>
                    <div className="pb-author">{b.author?.name||'Unknown'}</div>
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
