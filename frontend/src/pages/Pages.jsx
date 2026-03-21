import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore, useToastStore, useOnlineStore } from '../store';
import { Av, Btn, Input, Spinner, Empty } from '../components/ui';

// ── SVG Icons ─────────────────────────────────────────────────
const Icon = ({ size = 20, stroke = 'currentColor', strokeWidth = 1.8, children, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}>{children}</svg>
);
const BookIcon     = ({ size = 20, stroke }) => <Icon size={size} stroke={stroke || 'currentColor'}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></Icon>;
const AuthorIcon   = ({ size = 20, stroke }) => <Icon size={size} stroke={stroke || 'currentColor'}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>;
const UsersIcon    = ({ size = 20 })          => <Icon size={size}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></Icon>;
const LocationIcon = ({ size = 14 })          => <Icon size={size}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></Icon>;
const MessageIcon  = ({ size = 14 })          => <Icon size={size}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></Icon>;
const SearchIcon   = ({ size = 15 })          => <Icon size={size}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>;
const UploadIcon   = ({ size = 18, stroke })  => <Icon size={size} stroke={stroke || 'currentColor'}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>;
const PencilIcon   = ({ size = 14 })          => <Icon size={size}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>;
const InfoIcon     = ({ size = 14 })          => <Icon size={size}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Icon>;
const StarIcon     = ({ size = 11 })          => <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--amber-400)" stroke="var(--amber-400)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const NoBookIcon   = ({ size = 48 })          => <Icon size={size} strokeWidth={1.2} stroke="var(--text-3)"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="2" y1="2" x2="22" y2="22"/></Icon>;

// ─── Readers Page ─────────────────────────────────────────────
export function ReadersPage() {
  const { user: me } = useAuthStore();
  const { online }   = useOnlineStore();
  const navigate     = useNavigate();
  const [tab,    setTab]    = useState('readers');
  const [search, setSearch] = useState('');
  const [users,         setUsers]         = useState([]);
  const [usersLoading,  setUsersLoading]  = useState(true);
  const [usersTotal,    setUsersTotal]    = useState(0);
  const [authors,       setAuthors]       = useState([]);
  const [authorsLoading,setAuthorsLoading]= useState(false);
  const [authorsTotal,  setAuthorsTotal]  = useState(0);

  useEffect(() => {
    if (tab !== 'readers') return;
    setUsersLoading(true);
    const t = setTimeout(() => {
      api.get('/users', { params: { search, limit: 30 } })
        .then(({ data }) => { setUsers(data.users); setUsersTotal(data.total); })
        .finally(() => setUsersLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, tab]);

  useEffect(() => {
    if (tab !== 'authors') return;
    setAuthorsLoading(true);
    const t = setTimeout(() => {
      api.get('/authors', { params: { search, limit: 40 } })
        .then(({ data }) => { setAuthors(data.authors); setAuthorsTotal(data.total); })
        .finally(() => setAuthorsLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, tab]);

  const startChat = async (userId) => {
    if (!me) return navigate('/login');
    const { data } = await api.post('/chat/conversations', { userId });
    navigate(`/chat/${data.conversation._id}`);
  };

  const TabBtn = ({ v, label, icon, count }) => (
    <button onClick={() => { setTab(v); setSearch(''); }} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
      fontWeight: tab === v ? 600 : 400,
      color: tab === v ? 'var(--blue-btn)' : 'var(--text-2)',
      borderBottom: tab === v ? '2px solid var(--blue-btn)' : '2px solid transparent',
      transition: 'color 150ms',
    }}>
      {icon}{label}
      {count > 0 && <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--surface-alt)', borderRadius: 20, padding: '1px 7px' }}>{count}</span>}
    </button>
  );

  return (
    <div className="container page">
      <h1 className="h1" style={{ marginBottom: 4 }}>Community</h1>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>Browse readers and authors in Bookiverse</p>
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 20 }}>
        <TabBtn v="readers" label="Readers" icon={<UsersIcon size={16} />}  count={usersTotal} />
        <TabBtn v="authors" label="Authors" icon={<AuthorIcon size={16} />} count={authorsTotal} />
      </div>
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}><SearchIcon size={15} /></div>
        <input className="input" placeholder={tab === 'readers' ? 'Search readers…' : 'Search authors…'} value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {tab === 'readers' && (
        usersLoading ? <Spinner /> :
        users.filter(u => u._id !== me?._id).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><UsersIcon size={48} stroke="var(--text-3)" /></div>
            <div style={{ fontWeight: 600 }}>No readers found</div>
          </div>
        ) : (
          <div>
            {users.filter(u => u._id !== me?._id).map(u => (
              <div key={u._id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: '0.5px solid var(--border)' }}>
                <Link to={`/profile/${u._id}`} style={{ position: 'relative', flexShrink: 0 }}>
                  <Av user={u} size="md" />
                  {online.has(u._id) && <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, background: 'var(--green-400)', borderRadius: '50%', border: '2px solid var(--bg)' }} />}
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* ✅ Show displayName if available */}
                  <Link to={`/profile/${u._id}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>
                    {u.displayName || u.username}
                  </Link>
                  {u.displayName && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>@{u.username}</div>}
                  {u.bio && <p style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{u.bio}</p>}
                  <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}><BookIcon size={11} /> {u.collectedCount || 0} books</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}><UsersIcon size={11} /> {u.followersCount || 0} followers</span>
                  </div>
                </div>
                {me && (
                  <button onClick={() => startChat(u._id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 'var(--r-md)', border: '0.5px solid var(--border-strong)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <MessageIcon size={13} /> Message
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'authors' && (
        authorsLoading ? <Spinner /> :
        authors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><AuthorIcon size={48} stroke="var(--text-3)" /></div>
            <div style={{ fontWeight: 600 }}>No authors found</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14 }}>
            {authors.map(a => (
              <Link key={a._id} to={`/authors/${a._id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--r-lg)', transition: 'border-color 150ms, transform 150ms' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-400)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface-alt)', border: '0.5px solid var(--border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {a.photo ? <img src={a.photo} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <AuthorIcon size={24} stroke="var(--text-3)" />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                    {a.nationality && <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}><LocationIcon size={11} /> {a.nationality}</div>}
                    <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}><BookIcon size={11} /> {a.booksCount || 0} {a.booksCount === 1 ? 'book' : 'books'}</div>
                    {a.bio && <p style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 }}>{a.bio}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── Section Card (outside component to prevent re-render focus loss) ────────
function SettingSection({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 14, padding: 20 }}>
      <h2 className="h3" style={{ marginBottom: 16, paddingBottom: 10, borderBottom: '0.5px solid var(--border)' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────
export function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const { add }  = useToastStore();
  const navigate = useNavigate();
  const fileRef  = useRef();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username,    setUsername]    = useState(user?.username    || '');
  const [bio,         setBio]         = useState(user?.bio         || '');
  const [avatarFile,  setAvatarFile]  = useState(null);
  const [avatarPrev,  setAvatarPrev]  = useState('');
  const [pBusy, setPBusy] = useState(false);
  const [pErr,  setPErr]  = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [wBusy, setWBusy] = useState(false);
  const [wErr,  setWErr]  = useState('');

  const saveProfile = async (e) => {
    e.preventDefault(); setPErr(''); setPBusy(true);
    try {
      const fd = new FormData();
      fd.append('displayName', displayName);
      fd.append('username',    username);
      fd.append('bio',         bio);
      if (avatarFile) fd.append('avatar', avatarFile);
      const { data } = await api.put('/users/me', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      add('Profile updated!');
      setAvatarFile(null);
    } catch (e) { setPErr(e.response?.data?.message || 'Failed.'); }
    finally { setPBusy(false); }
  };

  const changePw = async (e) => {
    e.preventDefault(); setWErr('');
    if (newPassword !== confirmPassword) return setWErr('Passwords do not match.');
    if (newPassword.length < 6) return setWErr('Minimum 6 characters.');
    setWBusy(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      add('Password changed!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e) { setWErr(e.response?.data?.message || 'Failed.'); }
    finally { setWBusy(false); }
  };


  return (
    <div className="container page">
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1 className="h1" style={{ marginBottom: 20 }}>Settings</h1>
        <SettingSection title="Profile">
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {avatarPrev
                ? <img src={avatarPrev} alt="preview" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '0.5px solid var(--border)' }} />
                : <Av user={user} size="lg" />
              }
              <div>
                <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (f) { setAvatarFile(f); setAvatarPrev(URL.createObjectURL(f)); } }} />
                <Btn variant="ghost" size="sm" type="button" onClick={() => fileRef.current.click()}>Change avatar</Btn>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>JPG, PNG, WebP</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Display name *</label>
              <input className="input" placeholder="e.g. John Doe" value={displayName}
                onChange={e => setDisplayName(e.target.value)} required />
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Shown prominently on your profile</span>
            </div>

            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="input" value={username}
                onChange={e => setUsername(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="input textarea" value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="About yourself…" maxLength={300} style={{ minHeight: 72 }} />
              <span style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>{bio.length}/300</span>
            </div>

            {pErr && <p style={{ color: 'var(--rose-800)', fontSize: 13 }}>{pErr}</p>}
            <Btn variant="primary" type="submit" disabled={pBusy}>
              {pBusy ? 'Saving…' : 'Save profile'}
            </Btn>
          </form>
        </SettingSection>

        <SettingSection title="Change password">
          <form onSubmit={changePw} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Current password</label>
              <input className="input" type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input className="input" type="password" placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input className="input" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            {wErr && <p style={{ color: 'var(--rose-800)', fontSize: 13 }}>{wErr}</p>}
            <Btn variant="primary" type="submit" disabled={wBusy}>{wBusy ? 'Updating…' : 'Update password'}</Btn>
          </form>
        </SettingSection>

        <SettingSection title="Account">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-2)' }}>Email</span><span>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-2)' }}>Role</span>
              <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
            <hr className="divider" style={{ margin: '4px 0' }} />
            <Btn variant="danger" onClick={() => { logout(); navigate('/'); }}>Log out</Btn>
          </div>
        </SettingSection>
      </div>
    </div>
  );
}

// ─── Author Detail ─────────────────────────────────────────────
export function AuthorDetailPage() {
  const { id }   = useParams();
  const { user } = useAuthStore();
  const { add }  = useToastStore();
  const [author,  setAuthor]  = useState(null);
  const [books,   setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ name: '', bio: '', nationality: '' });
  const [saving,  setSaving]  = useState(false);
  const photoRef              = useRef();
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPrev, setPhotoPrev] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/authors/${id}`)
      .then(({ data }) => {
        setAuthor(data.author); setBooks(data.books);
        setForm({ name: data.author.name, bio: data.author.bio || '', nationality: data.author.nationality || '' });
      })
      .catch(() => setAuthor(null))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim()); fd.append('bio', form.bio); fd.append('nationality', form.nationality);
      if (photoFile) fd.append('photo', photoFile);
      const { data } = await api.put(`/authors/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAuthor(data.author); setPhotoFile(null); setPhotoPrev(''); setEditing(false); add('Author updated!');
    } catch (e) { add(e.response?.data?.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const cancelEdit = () => {
    if (author) setForm({ name: author.name, bio: author.bio || '', nationality: author.nationality || '' });
    setPhotoFile(null); setPhotoPrev(''); setEditing(false);
  };

  const canEdit   = user && (user.role === 'admin' || author?.uploadedBy?._id === user._id);
  const dispPhoto = photoPrev || author?.photo || '';

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>;
  if (!author)  return <div className="container page"><p>Author not found.</p></div>;

  return (
    <>
      <style>{`
        .author-photo-view { width:110px; height:110px; border-radius:50%; overflow:hidden; flex-shrink:0; border:2px solid var(--border); background:var(--surface-alt); display:flex; align-items:center; justify-content:center; }
        .author-photo-view img { width:100%; height:100%; object-fit:cover; display:block; }
        .author-photo-edit-wrap { width:120px; height:120px; border-radius:50%; overflow:hidden; flex-shrink:0; cursor:pointer; border:2px dashed var(--blue-400); background:var(--surface-alt); display:flex; align-items:center; justify-content:center; position:relative; transition:border-color 150ms,background 150ms; margin:0 auto 6px; }
        .author-photo-edit-wrap:hover { background:var(--blue-fill); border-color:var(--blue-btn); }
        .author-photo-edit-wrap img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
        .author-upload-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.42); border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; opacity:0; transition:opacity 150ms; }
        .author-photo-edit-wrap:hover .author-upload-overlay { opacity:1; }
        .ab-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; width:100%; }
        @media(min-width:480px)  { .ab-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; } }
        @media(min-width:768px)  { .ab-grid { grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; } }
        @media(min-width:1024px) { .ab-grid { grid-template-columns:repeat(5,minmax(0,1fr)); gap:18px; } }
        .ab-card { display:block; text-decoration:none; min-width:0; width:100%; background:var(--surface); border:0.5px solid var(--border); border-radius:8px; overflow:hidden; transition:transform 150ms,border-color 150ms; }
        .ab-card:hover { transform:translateY(-2px); border-color:var(--blue-400); }
        .ab-cover { width:100%; padding-top:150%; position:relative; background:var(--blue-fill); overflow:hidden; }
        .ab-cover img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; display:block; }
        .ab-cover .no-cover { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
        .ab-info { padding:7px 8px 10px; display:flex; flex-direction:column; gap:3px; min-width:0; }
        .ab-title { font-size:12px; font-weight:700; color:var(--text-1); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ab-sub   { font-size:10px; color:var(--text-3); }
        .up-label { font-size:13px; font-weight:500; color:var(--text-2); display:block; margin-bottom:5px; }
        .up-input { width:100%; background:var(--surface); border:0.5px solid var(--border-strong); border-radius:var(--r-md); padding:10px 12px; font-size:14px; color:var(--text-1); outline:none; transition:border-color 150ms; box-sizing:border-box; font-family:inherit; }
        .up-input:focus { border-color:var(--blue-400); }
        .up-input::placeholder { color:var(--text-3); }
        .up-textarea { resize:vertical; min-height:110px; }
        .up-btn { width:100%; padding:13px; background:var(--blue-btn); color:#fff; border:none; border-radius:var(--r-xl); font-size:15px; font-weight:600; cursor:pointer; transition:background 150ms; font-family:inherit; }
        .up-btn:hover { background:var(--blue-btn-h); }
        .up-btn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>
      <div className="container page">
        <div className="card" style={{ marginBottom: 28, padding: '24px 20px' }}>
          {editing ? (
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 460, margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) { setPhotoFile(f); setPhotoPrev(URL.createObjectURL(f)); } }} />
                <div className="author-photo-edit-wrap" onClick={() => photoRef.current.click()}>
                  {dispPhoto ? <img src={dispPhoto} alt={author.name} /> : <AuthorIcon size={40} stroke="var(--text-3)" />}
                  <div className="author-upload-overlay"><UploadIcon size={20} stroke="#fff" /><span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Change photo</span></div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>{photoFile ? photoFile.name : 'Click to change photo'}</p>
              </div>
              <div><label className="up-label">Author name *</label><input className="up-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><label className="up-label">Nationality</label><input className="up-input" value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} placeholder="e.g. British" /></div>
              <div><label className="up-label">Biography</label><textarea className="up-input up-textarea" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us about this author…" /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="up-btn" disabled={saving}>{saving ? 'Saving…' : 'Save Author'}</button>
                <button type="button" onClick={cancelEdit} style={{ padding: '12px 20px', background: 'transparent', color: 'var(--text-2)', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--r-xl)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="author-photo-view">{dispPhoto ? <img src={dispPhoto} alt={author.name} /> : <AuthorIcon size={44} stroke="var(--text-3)" />}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                  <h1 className="h1">{author.name}</h1>
                  {canEdit && <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 'var(--r-md)', border: '0.5px solid var(--border-strong)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}><PencilIcon size={13} /> Edit</button>}
                </div>
                {author.nationality && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}><LocationIcon size={14} />{author.nationality}</div>}
                <div style={{ marginBottom: 16 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--blue-fill)', color: 'var(--blue-text)', borderRadius: 'var(--r-md)', padding: '6px 14px', fontSize: 13, fontWeight: 600 }}><BookIcon size={14} />{books.length} {books.length === 1 ? 'Book' : 'Books'}</span></div>
                {author.bio ? (
                  <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.8, background: 'var(--surface-alt)', borderRadius: 'var(--r-md)', padding: '14px 16px', borderLeft: '3px solid var(--blue-400)' }}>{author.bio}</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>
                    <InfoIcon size={14} /> No biography available.
                    {canEdit && <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--blue-text)', cursor: 'pointer', fontSize: 13, padding: 0 }}>Add bio</button>}
                  </div>
                )}
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Added by <Link to={`/profile/${author.uploadedBy?._id}`} style={{ color: 'var(--blue-text)', marginLeft: 3 }}>{author.uploadedBy?.username}</Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {!editing && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Books</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>By {author.name}<span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400, marginLeft: 8 }}>({books.length})</span></h2>
            </div>
            {books.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><NoBookIcon size={52} /></div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>No books yet</div>
              </div>
            ) : (
              <div className="ab-grid">
                {books.map(b => (
                  <Link key={b._id} to={`/books/${b._id}`} className="ab-card">
                    <div className="ab-cover">{b.coverImage ? <img src={b.coverImage} alt={b.title} loading="lazy" /> : <div className="no-cover"><BookIcon size={32} stroke="var(--text-3)" /></div>}</div>
                    <div className="ab-info">
                      <div className="ab-title">{b.title}</div>
                      <div className="ab-sub">{b.genre}</div>
                      {(b.averageRating > 0 || b.collectionsCount > 0) && (
                        <div className="ab-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {b.averageRating > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><StarIcon size={10} />{b.averageRating.toFixed(1)}</span>}
                          {b.collectionsCount > 0 && <span>{b.collectionsCount} collected</span>}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Search ───────────────────────────────────────────────────
export function SearchPage() {
  const [params]  = useSearchParams();
  const q         = params.get('q') || '';
  const [tab,     setTab]     = useState('books');
  const [books,   setBooks]   = useState([]);
  const [authors, setAuthors] = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    Promise.all([
      api.get('/books',   { params: { search: q, limit: 24 } }),
      api.get('/authors', { params: { search: q, limit: 12 } }),
      api.get('/users',   { params: { search: q, limit: 12 } }),
    ]).then(([b, a, u]) => {
      setBooks(b.data.books); setAuthors(a.data.authors); setUsers(u.data.users);
    }).finally(() => setLoading(false));
  }, [q]);

  const T = ({ v, l, n }) => (
    <button onClick={() => setTab(v)} style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === v ? 600 : 400, color: tab === v ? 'var(--blue-btn)' : 'var(--text-2)', borderBottom: tab === v ? '2px solid var(--blue-btn)' : '2px solid transparent' }}>
      {l} {n > 0 && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>({n})</span>}
    </button>
  );

  return (
    <div className="container page">
      <h1 className="h1" style={{ marginBottom: 4 }}>Search results</h1>
      <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}><SearchIcon size={15} /> for "{q}"</p>
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 20 }}>
        <T v="books" l="Books" n={books.length} /><T v="authors" l="Authors" n={authors.length} /><T v="readers" l="Readers" n={users.length} />
      </div>
      {loading ? <Spinner /> : (
        <>
          {tab === 'books' && (books.length === 0 ? <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-3)' }}><div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><BookIcon size={48} stroke="var(--text-3)" /></div><div style={{ fontWeight: 600 }}>No books found</div></div> : <div className="book-grid">{books.map(b => (<Link key={b._id} to={`/books/${b._id}`} style={{ textDecoration: 'none' }}><div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 8, overflow: 'hidden', transition: 'transform 150ms' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = ''}><div style={{ width: '100%', paddingTop: '150%', position: 'relative', background: 'var(--blue-fill)' }}>{b.coverImage ? <img src={b.coverImage} alt={b.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookIcon size={32} stroke="var(--text-3)" /></div>}</div><div style={{ padding: '7px 8px 10px' }}><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div><div style={{ fontSize: 11, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.author?.name || 'Unknown'}</div></div></div></Link>))}</div>)}
          {tab === 'authors' && (authors.length === 0 ? <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-3)' }}><div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><AuthorIcon size={48} stroke="var(--text-3)" /></div><div style={{ fontWeight: 600 }}>No authors found</div></div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12 }}>{authors.map(a => (<Link key={a._id} to={`/authors/${a._id}`} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, textDecoration: 'none' }}><div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-alt)', border: '0.5px solid var(--border)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.photo ? <img src={a.photo} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <AuthorIcon size={20} stroke="var(--text-3)" />}</div><div><div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>{a.nationality && <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}><LocationIcon size={11} />{a.nationality}</div>}<div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}><BookIcon size={11} />{a.booksCount || 0} books</div></div></Link>))}</div>)}
          {tab === 'readers' && (users.length === 0 ? <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-3)' }}><div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><UsersIcon size={48} stroke="var(--text-3)" /></div><div style={{ fontWeight: 600 }}>No readers found</div></div> : users.map(u => (<Link key={u._id} to={`/profile/${u._id}`} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '0.5px solid var(--border)', textDecoration: 'none' }}><Av user={u} size="md" /><div><div style={{ fontWeight: 600, fontSize: 14 }}>{u.displayName || u.username}</div>{u.displayName && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>@{u.username}</div>}<div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 10, marginTop: 2 }}><span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><BookIcon size={11} />{u.collectedCount || 0} books</span><span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><UsersIcon size={11} />{u.followersCount || 0} followers</span></div></div></Link>)))}
        </>
      )}
    </div>
  );
}
