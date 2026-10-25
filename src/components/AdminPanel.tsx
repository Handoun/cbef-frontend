import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminPanel({ token, onClose }: { token: string; onClose: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<'users' | 'reports'>('users');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<string>('0');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      axios.get(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/api/admin/reports`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([usersRes, reportsRes]) => {
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
      })
      .catch((err) => {
        console.error('Admin panel load error:', err);
        if (err.response?.status === 403) {
          setErrorMsg('Доступ запрещен: вы не обладаете правами администратора.');
        } else {
          setErrorMsg('Ошибка при загрузке данных админ-панели.');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const banUser = async (id: number) => {
    const durationDays = parseInt(banDuration) || 0;
    try {
      await axios.put(
        `${API_URL}/api/admin/ban/${id}`,
        { reason: banReason, durationDays },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, banned: true, ban_reason: banReason } : u)));
      setBanReason('');
      setSelectedUserId(null);
    } catch (e) {
      alert('Ошибка при блокировке пользователя.');
    }
  };

  const unbanUser = async (id: number) => {
    try {
      await axios.put(`${API_URL}/api/admin/unban/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, banned: false, ban_reason: null } : u)));
    } catch {
      alert('Ошибка при разблокировке.');
    }
  };

  const makeAdmin = async (id: number) => {
    try {
      await axios.put(`${API_URL}/api/admin/make-admin/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, is_admin: true } : u)));
    } catch {
      alert('Ошибка при назначении администратора.');
    }
  };

  const removeAdmin = async (id: number) => {
    try {
      await axios.put(`${API_URL}/api/admin/remove-admin/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, is_admin: false } : u)));
    } catch {
      alert('Ошибка при снятии прав администратора.');
    }
  };

  const grantSubscription = async (userId: number) => {
    const days = prompt('На сколько дней выдать подписку?', '30');
    if (days) {
      try {
        const res = await axios.put(
          `${API_URL}/api/admin/grant-subscription/${userId}`,
          { durationDays: parseInt(days) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, subscription_until: res.data.subscription_until } : u))
        );
        alert('Подписка успешно выдана!');
      } catch {
        alert('Ошибка при выдаче подписки.');
      }
    }
  };

  const removeSubscription = async (userId: number) => {
    if (confirm('Снять подписку у пользователя?')) {
      try {
        await axios.put(
          `${API_URL}/api/admin/remove-subscription/${userId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers(prev => prev.map(u => (u.id === userId ? { ...u, subscription_until: null } : u)));
        alert('Подписка снята.');
      } catch {
        alert('Ошибка при снятии подписки.');
      }
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5000,
  };

  const panelStyle: React.CSSProperties = {
    backgroundColor: 'var(--sidebar-bg)',
    borderRadius: 24,
    padding: 24,
    width: '92%',
    maxWidth: 780,
    maxHeight: '84vh',
    overflowY: 'auto',
    color: 'var(--text-primary)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
    border: '1px solid var(--border-color)',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    background: active ? '#0084ff' : 'var(--input-bg)',
    color: active ? 'white' : 'var(--text-primary)',
    fontWeight: active ? 600 : 400,
    fontSize: 14,
    transition: 'all 0.15s',
  });

  const actionBtn: React.CSSProperties = {
    padding: '5px 10px',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    marginRight: 6,
    marginBottom: 4,
    transition: 'opacity 0.15s',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={containerStyle} onClick={onClose}>
      <motion.div initial={{ scale: 0.94, y: 15 }} animate={{ scale: 1, y: 0 }} style={panelStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛡️ Панель администратора
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            ✕
          </button>
        </div>

        {errorMsg ? (
          <div style={{ padding: 20, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 16, color: '#ef4444', textAlign: 'center' }}>
            {errorMsg}
          </div>
        ) : loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Загрузка данных...
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button style={tabStyle(tab === 'users')} onClick={() => setTab('users')}>
                Пользователи ({users.length})
              </button>
              <button style={tabStyle(tab === 'reports')} onClick={() => setTab('reports')}>
                Жалобы ({reports.length})
              </button>
            </div>

            {tab === 'users' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 13 }}>
                      <th style={{ padding: '8px 10px' }}>ID</th>
                      <th style={{ padding: '8px 10px' }}>Имя</th>
                      <th style={{ padding: '8px 10px' }}>Админ</th>
                      <th style={{ padding: '8px 10px' }}>Бан</th>
                      <th style={{ padding: '8px 10px' }}>Подписка</th>
                      <th style={{ padding: '8px 10px' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 10px' }}>{u.id}</td>
                        <td style={{ padding: '10px 10px', fontWeight: 600 }}>{u.username}</td>
                        <td style={{ padding: '10px 10px' }}>{u.is_admin ? '✅ Да' : '—'}</td>
                        <td style={{ padding: '10px 10px' }}>{u.banned ? `🚫 ${u.ban_reason || 'Забанен'}` : '✅ Активен'}</td>
                        <td style={{ padding: '10px 10px', fontSize: 12 }}>
                          {u.subscription_until ? `до ${new Date(u.subscription_until).toLocaleDateString()}` : '—'}
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {u.is_admin ? (
                              <button style={{ ...actionBtn, background: '#f59e0b', color: 'white' }} onClick={() => removeAdmin(u.id)}>
                                Забрать админа
                              </button>
                            ) : (
                              <button style={{ ...actionBtn, background: '#10b981', color: 'white' }} onClick={() => makeAdmin(u.id)}>
                                Админ
                              </button>
                            )}

                            {u.banned ? (
                              <button style={{ ...actionBtn, background: '#10b981', color: 'white' }} onClick={() => unbanUser(u.id)}>
                                Разбан
                              </button>
                            ) : (
                              <button style={{ ...actionBtn, background: '#ef4444', color: 'white' }} onClick={() => setSelectedUserId(u.id)}>
                                Бан
                              </button>
                            )}

                            <button style={{ ...actionBtn, background: '#0084ff', color: 'white' }} onClick={() => grantSubscription(u.id)}>
                              +Подписка
                            </button>
                            <button style={{ ...actionBtn, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }} onClick={() => removeSubscription(u.id)}>
                              -Подписка
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'reports' && (
              <div>
                {reports.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>Жалоб пока нет.</p>
                ) : (
                  reports.map(r => (
                    <div
                      key={r.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        padding: '12px 8px',
                      }}
                    >
                      <strong>{r.reporter_name}</strong> пожаловался на <strong>{r.reported_name}</strong>
                      <br />
                      Причина: {r.reason || 'не указана'}
                      <br />
                      <small style={{ color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleString()}</small>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedUserId && (
              <div
                style={{
                  marginTop: 18,
                  backgroundColor: 'var(--hover-bg)',
                  padding: 16,
                  borderRadius: 16,
                  border: '1px solid var(--border-color)',
                }}
              >
                <h4 style={{ margin: '0 0 10px' }}>Забанить пользователя ID {selectedUserId}</h4>
                <input
                  placeholder="Причина бана"
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  style={{
                    width: '100%',
                    marginBottom: 10,
                    padding: '8px 12px',
                    borderRadius: 16,
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                  }}
                />
                <select
                  value={banDuration}
                  onChange={e => setBanDuration(e.target.value)}
                  style={{
                    width: '100%',
                    marginBottom: 12,
                    padding: '8px 12px',
                    borderRadius: 16,
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="0">Навсегда</option>
                  <option value="1">1 день</option>
                  <option value="7">7 дней</option>
                  <option value="30">30 дней</option>
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => banUser(selectedUserId)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: 16,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Забанить
                  </button>
                  <button
                    onClick={() => setSelectedUserId(null)}
                    style={{
                      background: 'var(--button-bg)',
                      color: 'var(--button-text)',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: 16,
                      cursor: 'pointer',
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            width: '100%',
            padding: 12,
            borderRadius: 20,
            border: 'none',
            background: 'var(--button-bg)',
            color: 'var(--button-text)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Закрыть
        </button>
      </motion.div>
    </motion.div>
  );
}
