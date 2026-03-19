import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Av } from './ui';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const onSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setQ('');
  };

  const navLink = ({ isActive }) => ({
    fontSize: 14, fontWeight: isActive ? 600 : 400,
    color: isActive ? 'var(--blue-btn)' : 'var(--text-2)',
  });

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: 'var(--surface)', borderBottom: '0.5px solid var(--border)',
      height: 'var(--nav-h)',
    }}>
      <div className="container" style={{
        height: '100%', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Logo */}
        <Link to="/" style={{ fontWeight: 700, fontSize: 17, color: 'var(--blue-btn)', letterSpacing: '-0.3px', flexShrink: 0 }}>
          Booknverse
        </Link>

        {/* Search */}
        <form onSubmit={onSearch} style={{ flex: 1, maxWidth: 320 }}>
          <input
            className="input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search…"
            style={{ padding: '7px 10px', fontSize: 13 }}
          />
        </form>

        {/* Nav links - hidden on very small, shown md+ */}
        {user && (
          <nav style={{ display: 'flex', gap: 18, flexShrink: 0 }} className="nav-links">
            <NavLink to="/"        end style={navLink}>Home</NavLink>
            <NavLink to="/upload"      style={navLink}>Upload</NavLink>
            <NavLink to="/readers"     style={navLink}>Readers</NavLink>
            {user.role === 'admin' &&
              <NavLink to="/admin" style={navLink}>Admin</NavLink>
            }
          </nav>
        )}

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          {user ? (
            <>
              <Link to="/chat" style={{
                width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--r-md)', border: '0.5px solid var(--border)', fontSize: 16,
                color: 'var(--text-2)',
              }}>✉</Link>
              <Link to={`/profile/${user._id}`}>
                <Av user={user} size="sm" />
              </Link>
              <Link to="/settings" style={{
                width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--r-md)', border: '0.5px solid var(--border)', fontSize: 15,
                color: 'var(--text-2)',
              }}>⚙</Link>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')}   className="btn btn-ghost btn-sm">Log in</button>
              <button onClick={() => navigate('/register')} className="btn btn-primary btn-sm">Sign up</button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) { .nav-links { display: none !important; } }
      `}</style>
    </header>
  );
}
