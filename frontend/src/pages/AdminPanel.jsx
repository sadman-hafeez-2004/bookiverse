import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useToastStore } from '../store';
import { Button, Avatar, Spinner } from '../components/ui';

export default function AdminPanel() {
  const { add }    = useToastStore();
  const [tab, setTab]     = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data.stats);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      api.get('/admin/users', { params: { search, limit: 30 } }).then(({ data }) => setUsers(data.users));
    }
    if (tab === 'books') {
      api.get('/books', { params: { search, limit: 30 } }).then(({ data }) => setBooks(data.books));
    }
  }, [tab, search]);

  const deleteUser = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(us => us.filter(u => u._id !== id));
    add('User deleted.');
  };

  const changeRole = async (id, role) => {
    const { data } = await api.put(`/admin/users/${id}/role`, { role });
    setUsers(us => us.map(u => u._id === id ? data.user : u));
    add(`Role updated to ${role}.`);
  };

  const deleteBook = async (id, title) => {
    if (!window.confirm(`Delete book "${title}"?`)) return;
    await api.delete(`/admin/books/${id}`);
    setBooks(bs => bs.filter(b => b._id !== id));
    add('Book deleted.');
  };

  const StatCard = ({ label, value, color = 'var(--blue-fill)', textColor = 'var(--blue-text)' }) => (
    <div style={{ background: color, borderRadius: 'var(--r-lg)', padding: '20px 24px', border: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: textColor }}>{value?.toLocaleString()}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );

  const TabBtn = ({ value, label }) => (
    <button onClick={() => { setTab(value); setSearch(''); }} style={{
      padding: '9px 18px', fontSize: 14, background: 'none', border: 'none',
      borderBottom: tab === value ? '2px solid var(--blue-btn)' : '2px solid transparent',
      color: tab === value ? 'var(--blue-btn)' : 'var(--text-secondary)',
      fontWeight: tab === value ? 600 : 400, cursor: 'pointer',
    }}>
      {label}
    </button>
  );

  return (
    <div className="container page-padding">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="h1">Admin panel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage Booknverse</p>
        </div>
        <span className="tag tag-amber">Admin</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 28 }}>
        <TabBtn value="overview" label="Overview" />
        <TabBtn value="users"    label="Users"    />
        <TabBtn value="books"    label="Books"    />
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        loading ? <Spinner /> : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
              <StatCard label="Total users"   value={stats?.users}   />
              <StatCard label="Total books"   value={stats?.books}   color="var(--green-50)"  textColor="var(--green-800)" />
              <StatCard label="Total authors" value={stats?.authors} color="#FEF3C7" textColor="#92400E" />
              <StatCard label="Total reviews" value={stats?.reviews} color="var(--rose-50)"   textColor="var(--rose-800)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card">
                <h3 className="h3" style={{ marginBottom: 14 }}>Quick actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Button variant="ghost" full onClick={() => setTab('users')}>Manage users →</Button>
                  <Button variant="ghost" full onClick={() => setTab('books')}>Manage books →</Button>
                </div>
              </div>
              <div className="card">
                <h3 className="h3" style={{ marginBottom: 14 }}>Platform info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Books per author (avg)</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {stats?.authors > 0 ? (stats.books / stats.authors).toFixed(1) : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Reviews per book (avg)</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {stats?.books > 0 ? (stats.reviews / stats.books).toFixed(1) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          <input
            className="input"
            placeholder="Search users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320, marginBottom: 20 }}
          />
          <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 120px 120px', gap: 0, padding: '10px 16px', background: 'var(--surface-alt)', borderBottom: '0.5px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {users.map((u, i) => (
              <div key={u._id} style={{
                display: 'grid', gridTemplateColumns: '1fr 180px 120px 120px', gap: 0,
                padding: '12px 16px', alignItems: 'center',
                borderBottom: i < users.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                  <Avatar user={u} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/profile/${u._id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{u.username}</Link>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.collectedCount || 0} books</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                <div>
                  <select
                    value={u.role}
                    onChange={e => changeRole(u._id, e.target.value)}
                    className="input"
                    style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Button variant="danger" size="sm" onClick={() => deleteUser(u._id, u.username)}>Delete</Button>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No users found</div>
            )}
          </div>
        </div>
      )}

      {/* Books */}
      {tab === 'books' && (
        <div>
          <input
            className="input"
            placeholder="Search books…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320, marginBottom: 20 }}
          />
          <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 80px 100px', padding: '10px 16px', background: 'var(--surface-alt)', borderBottom: '0.5px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Book</span>
              <span>Author</span>
              <span>Genre</span>
              <span>Rating</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {books.map((b, i) => (
              <div key={b._id} style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 100px 80px 100px',
                padding: '12px 16px', alignItems: 'center',
                borderBottom: i < books.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                  <div style={{ width: 32, height: 46, borderRadius: 4, background: 'var(--blue-fill)', flexShrink: 0, overflow: 'hidden' }}>
                    {b.coverImage && <img src={b.coverImage} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <Link to={`/books/${b._id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</Link>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.author?.name}</div>
                <span className="tag tag-neutral" style={{ fontSize: 10 }}>{b.genre}</span>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  ★ {b.averageRating?.toFixed(1) || '—'}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Button variant="danger" size="sm" onClick={() => deleteBook(b._id, b.title)}>Delete</Button>
                </div>
              </div>
            ))}

            {books.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No books found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
