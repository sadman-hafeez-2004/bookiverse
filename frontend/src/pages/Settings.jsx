import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore, useToastStore } from '../store';
import { Button, Input, Avatar } from '../components/ui';

export default function Settings() {
  const { user, updateUser, logout } = useAuthStore();
  const { add }    = useToastStore();
  const navigate   = useNavigate();
  const fileRef    = useRef();

  const [form, setForm] = useState({ username: user?.username || '', bio: user?.bio || '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError,   setProfileError]   = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileError(''); setProfileLoading(true);
    try {
      const fd = new FormData();
      if (form.username !== user.username) fd.append('username', form.username);
      fd.append('bio', form.bio);
      if (avatarFile) fd.append('avatar', avatarFile);
      const { data } = await api.put('/users/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(data.user);
      add('Profile updated!');
      setAvatarFile(null);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Update failed.');
    } finally { setProfileLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirm) return setPwError('Passwords do not match.');
    if (pwForm.newPassword.length < 6) return setPwError('Password must be at least 6 characters.');
    setPwLoading(true);
    try {
      await api.put('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      add('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally { setPwLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const Section = ({ title, children }) => (
    <div className="card" style={{ marginBottom: 16, padding: 24 }}>
      <h2 className="h3" style={{ marginBottom: 20, paddingBottom: 12, borderBottom: '0.5px solid var(--border)' }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="container page-padding">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 className="h1" style={{ marginBottom: 24 }}>Settings</h1>

        {/* Profile section */}
        <Section title="Profile">
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="preview" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '0.5px solid var(--border)' }} />
                  : <Avatar user={user} size="lg" />
                }
              </div>
              <div>
                <input type="file" accept="image/*" ref={fileRef} onChange={handleAvatarChange} style={{ display: 'none' }} />
                <Button variant="ghost" size="sm" type="button" onClick={() => fileRef.current.click()}>
                  Change avatar
                </Button>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG or WebP, max 5MB</p>
              </div>
            </div>

            <Input
              label="Username"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              required
            />

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                className="input textarea"
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Tell the community about yourself…"
                maxLength={300}
                style={{ minHeight: 80 }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{form.bio.length}/300</span>
            </div>

            {profileError && <p style={{ color: 'var(--rose-800)', fontSize: 13 }}>{profileError}</p>}

            <Button variant="primary" type="submit" disabled={profileLoading}>
              {profileLoading ? 'Saving…' : 'Save profile'}
            </Button>
          </form>
        </Section>

        {/* Password section */}
        <Section title="Change password">
          <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Current password"
              type="password"
              placeholder="••••••••"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              required
            />
            <Input
              label="New password"
              type="password"
              placeholder="At least 6 characters"
              value={pwForm.newPassword}
              onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              required
            />
            {pwError && <p style={{ color: 'var(--rose-800)', fontSize: 13 }}>{pwError}</p>}
            <Button variant="primary" type="submit" disabled={pwLoading}>
              {pwLoading ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </Section>

        {/* Account section */}
        <Section title="Account">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Email</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Role</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
            </div>
            <hr className="divider" />
            <Button variant="danger" onClick={handleLogout}>Log out</Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
