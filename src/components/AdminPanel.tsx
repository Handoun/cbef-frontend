import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminPanel({ token, onClose }: { token: string; onClose: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [tab, setTab] = useState<'users' | 'reports'>('users');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<string>('0');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUsers(r.data)).catch(console.error);
    axios.get(`${API_URL}/api/admin/reports`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setReports(r.data)).catch(console.error);
  }, [token]);

  const banUser = async (id: number) => {
    const durationDays = parseInt(banDuration) || 0;
    await axios.put(`${API_URL}/api/admin/ban/${id}`, { reason: banReason, durationDays }, { headers: { Authorization: `Bearer ${token}` } });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, banned: true, ban_reason: banReason } : u));
    setBanReason('');
    setSelectedUserId(null);
  };

  const unbanUser = async (id: number) => {
    await axios.put(`${API_URL}/api/admin/unban/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, banned: false, ban_reason: null } : u));
  };

  const makeAdmin = async (id: number) => {
    await axios.put(`${API_URL}/api/admin/make-admin/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_admin: true } : u));
  };

  const removeAdmin = async (id: number) => {
    await axios.put(`${API_URL}/api/admin/remove-admin/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_admin: false } : u));
  };

  const grantSubscription = async (userId: number) => {
    const days = prompt('На сколько дней выдать подписку?', '30');
    if (days) {
      await axios.put(`${API_URL}/api/admin/grant-subscription/${userId}`, { durationDays: parseInt(days) }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Подписка выдана');
    }
  };

  const removeSubscription = async (userId: number) => {
    if (confirm('Снять подписку у пользователя?')) {
      await axios.put(`${API_URL}/api/admin/remove-subscription/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Подписка снята');
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  };
  const panelStyle: React.CSSProperties = {
    backgroundColor: 'var(--sidebar-bg)', borderRadius: 24, padding: 24,
    width: '90%', maxWidth: 700, maxHeight: '80vh', overflow: 'auto',
    color: 'var(--text-primary)',
  };
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
    background: active ? 'var(--button-bg)' : 'transparent',
    color: 'var(--text-primary)', fontWeight: active ? 600 : 400,
  });
  const actionBtn: React.CSSProperties = {
    padding: '4px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, marginRight: 6,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={containerStyle} onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={panelStyle} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>🛡️ Админ-панель</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button style={tabStyle(tab === 'users')} onClick={() => setTab('users')}>Пользователи</button>
          <button style={tabStyle(tab === 'reports')} onClick={() => setTab('reports')}>Жалобы</button>
        </div>
        {tab === 'users' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>ID</th><th>Имя</th><th>Админ</th><th>Бан</th><th>Подписка</th><th>Действия</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.is_admin ? '✅' : '❌'}</td>
                  <td>{u.banned ? `🚫 ${u.ban_reason || ''}` : '✅'}</td>
                  <td>{u.subscription_until ? `до ${new Date(u.subscription_until).toLocaleDateString()}` : '❌'}</td>
                  <td>
                    {u.is_admin ? (
                      <button style={{ ...actionBtn, background: '#ff9800', color: 'white' }} onClick={() => removeAdmin(u.id)}>Забрать админа</button>
                    ) : (
                      <button style={{ ...actionBtn, background: '#4caf50', color: 'white' }} onClick={() => makeAdmin(u.id)}>Админ</button>
                    )}
                    {u.banned ? (
                      <button style={{ ...actionBtn, background: '#4caf50', color: 'white' }} onClick={() => unbanUser(u.id)}>Разбан</button>
                    ) : (
                      <button style={{ ...actionBtn, background: '#f44336', color: 'white' }} onClick={() => setSelectedUserId(u.id)}>Бан</button>
                    )}
                    <button style={{ ...actionBtn, background: '#0084ff', color: 'white' }} onClick={() => grantSubscription(u.id)}>Выдать подписку</button>
                    <button style={{ ...actionBtn, background: '#ff9800', color: 'white' }} onClick={() => removeSubscription(u.id)}>Снять подписку</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'reports' && (
          <div>
            {reports.length === 0 && <p>Нет жалоб</p>}
            {reports.map(r => (
              <div key={r.id} style={{ borderBottom: '1px solid var(--border-color)', padding: '8px 0' }}>
                <strong>{r.reporter_name}</strong> пожаловался на <strong>{r.reported_name}</strong><br />
                Причина: {r.reason || 'не указана'}<br />
                <small>{new Date(r.created_at).toLocaleString()}</small>
              </div>
            ))}
          </div>
        )}
        {selectedUserId && (
          <div style={{ marginTop: 20, background: 'var(--hover-bg)', padding: 12, borderRadius: 12 }}>
            <h4>Забанить пользователя ID {selectedUserId}</h4>
            <input placeholder="Причина бана" value={banReason} onChange={e => setBanReason(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 20, border: '1px solid var(--border-color)' }} />
            <select value={banDuration} onChange={e => setBanDuration(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 20, border: '1px solid var(--border-color)' }}>
              <option value="0">Навсегда</option>
              <option value="1">1 день</option>
              <option value="7">7 дней</option>
              <option value="30">30 дней</option>
            </select>
            <button onClick={() => banUser(selectedUserId)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer' }}>Забанить</button>
            <button onClick={() => setSelectedUserId(null)} style={{ marginLeft: 8, background: 'var(--button-bg)', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer' }}>Отмена</button>
          </div>
        )}
        <button onClick={onClose} style={{ marginTop: 20, width: '100%', padding: 12, borderRadius: 20, border: 'none', background: 'var(--button-bg)', color: 'var(--button-text)', cursor: 'pointer', fontWeight: 600 }}>Закрыть</button>
      </motion.div>
    </motion.div>
  );
}