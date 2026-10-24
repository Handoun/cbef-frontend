import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Avatar from './Avatar';

const API_URL = import.meta.env.VITE_API_URL;

export default function Settings() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>('light');
  const [sessions, setSessions] = useState<any[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [subscription, setSubscription] = useState<string | null>(null);
  const [premiumOnly, setPremiumOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isPremiumUser = currentUser.is_premium === true || currentUser.premium === true;

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || '');
        setBio(user.bio || '');
      } catch {}
    }
    const savedAvatar = localStorage.getItem('avatar');
    if (savedAvatar) setAvatar(savedAvatar);

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (token) {
      // Load current profile data
      axios
        .get(`${API_URL}/api/users/${currentUser.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (res.data) {
            if (res.data.username) setUsername(res.data.username);
            if (res.data.bio !== undefined) setBio(res.data.bio || '');
            if (res.data.avatar) {
              setAvatar(res.data.avatar);
              localStorage.setItem('avatar', res.data.avatar);
            }
            setPremiumOnly(res.data.premium_only_messages || false);
          }
        })
        .catch(console.error);

      axios
        .get(`${API_URL}/api/sessions`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setSessions(res.data || []))
        .catch(console.error);

      axios
        .get(`${API_URL}/api/subscription`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setSubscription(res.data?.subscription_until || null))
        .catch(console.error);
    }
  }, [token, currentUser.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'Размер фото не должен превышать 5МБ', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setAvatar(base64);
      try {
        await axios.post(
          `${API_URL}/api/user/avatar`,
          { avatar: base64 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        localStorage.setItem('avatar', base64);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.avatar = base64;
        localStorage.setItem('user', JSON.stringify(user));
        setMessage({ text: 'Аватар успешно обновлен!', type: 'success' });
      } catch {
        setMessage({ text: 'Не удалось сохранить аватар на сервере', type: 'error' });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeSession = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/api/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(prev => prev.filter(s => s.id !== id));
      setMessage({ text: 'Сессия завершена', type: 'success' });
    } catch {
      setMessage({ text: 'Ошибка при удалении сессии', type: 'error' });
    }
  };

  const togglePremiumOnly = async () => {
    const newVal = !premiumOnly;
    setPremiumOnly(newVal);
    try {
      await axios.put(
        `${API_URL}/api/users/premium-only`,
        { enabled: newVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.put(
        `${API_URL}/api/users/profile`,
        { username, bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.username = username;
        user.bio = bio;
        localStorage.setItem('user', JSON.stringify(user));
      }
      setMessage({ text: 'Настройки успешно сохранены!', type: 'success' });
      setTimeout(() => navigate('/chat'), 1000);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setMessage({ text: 'Это имя пользователя уже занято', type: 'error' });
      } else {
        setMessage({ text: 'Ошибка при сохранении профиля', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('avatar');
    navigate('/login', { replace: true });
  };

  const themes = [
    { id: 'light', label: '☀️ Светлая' },
    { id: 'dark', label: '🌙 Тёмная' },
    { id: 'ocean', label: '🌊 Океан' },
    { id: 'forest', label: '🌲 Лес' },
    { id: 'sunset', label: '🌅 Закат' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: 'var(--text-primary)',
        transition: 'all 0.2s',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--sidebar-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '32px 28px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button
            onClick={() => navigate('/chat')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            ←
          </button>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Настройки профиля</h2>
          <div style={{ width: 22 }} />
        </div>

        {message && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: 20,
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: message.type === 'success' ? '#16a34a' : '#ef4444',
            }}
          >
            {message.text}
          </div>
        )}

        {/* Аватар */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <Avatar src={avatar || undefined} name={username} size={84} />
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              id="avatarUpload"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <label
              htmlFor="avatarUpload"
              style={{
                display: 'inline-block',
                padding: '10px 18px',
                borderRadius: '20px',
                backgroundColor: 'var(--button-bg)',
                color: 'var(--button-text)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              📷 Сменить фото
            </label>
          </div>
        </div>

        {/* Имя пользователя */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            ИМЯ ПОЛЬЗОВАТЕЛЯ
          </label>
          <input
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Ваше имя"
          />
        </div>

        {/* О себе (Bio) */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            О СЕБЕ
          </label>
          <textarea
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: 15,
              outline: 'none',
              resize: 'none',
              height: 80,
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Расскажите немного о себе..."
          />
        </div>

        {/* Тема оформления */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            ТЕМА ОФОРМЛЕНИЯ
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => changeTheme(t.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '16px',
                  border: theme === t.id ? '2px solid #0084ff' : '1px solid var(--border-color)',
                  backgroundColor: theme === t.id ? 'rgba(0, 132, 255, 0.15)' : 'var(--input-bg)',
                  color: theme === t.id ? '#0084ff' : 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Подписка CBEF Premium */}
        <div
          style={{
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>⭐ CBEF Premium</span>
            <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 10, backgroundColor: isPremiumUser ? '#22c55e' : '#94a3b8', color: 'white' }}>
              {isPremiumUser ? 'АКТИВНА' : 'НЕДОСТУПНА'}
            </span>
          </div>
          {subscription ? (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Действует до: {new Date(subscription).toLocaleDateString()}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Для оформления обратитесь к администратору.
            </div>
          )}
        </div>

        {/* Сессии */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>АКТИВНЫЕ УСТРОЙСТВА</span>
            <button
              onClick={() => setShowSessions(!showSessions)}
              style={{ background: 'none', border: 'none', color: '#0084ff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
            >
              {showSessions ? 'Скрыть' : `Показать (${sessions.length})`}
            </button>
          </div>

          {showSessions && (
            <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 12, padding: 8 }}>
              {sessions.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: 8 }}>Нет других активных сессий</div>
              ) : (
                sessions.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 13 }}>
                      <div>{s.device || 'Браузер / Компьютер'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.ip || ''}</div>
                    </div>
                    <button
                      onClick={() => removeSession(s.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Завершить
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Разрешения: Микрофон, Камера, Уведомления */}
        <div
          style={{
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
            🔒 Разрешения приложения
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Уведомления</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {typeof Notification !== 'undefined' && Notification.permission === 'granted'
                  ? 'Включены'
                  : 'Не разрешены'}
              </div>
            </div>
            <button
              onClick={async () => {
                if (typeof Notification !== 'undefined') {
                  const perm = await Notification.requestPermission();
                  if (perm === 'granted') {
                    setMessage({ text: 'Уведомления успешно включены!', type: 'success' });
                  } else {
                    setMessage({ text: 'Уведомления отклонены или заблокированы в настройках браузера/системы', type: 'error' });
                  }
                }
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: 'var(--button-bg)',
                color: 'var(--button-text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔔 Разрешить
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Микрофон и Камера</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Для звонков и аудио</div>
            </div>
            <button
              onClick={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                  stream.getTracks().forEach(t => t.stop());
                  setMessage({ text: 'Доступ к микрофону и камере подтверждён!', type: 'success' });
                } catch {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(t => t.stop());
                    setMessage({ text: 'Доступ к микрофону подтверждён!', type: 'success' });
                  } catch {
                    setMessage({ text: 'Доступ заблокирован. Разрешите микрофон в настройках браузера или приложения', type: 'error' });
                  }
                }
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: 'var(--button-bg)',
                color: 'var(--button-text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🎙️ Запросить
            </button>
          </div>
        </div>

        {/* Кнопки сохранения и отмены */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '24px',
              backgroundColor: '#0084ff',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Сохранение...' : '💾 Сохранить'}
          </button>
          <button
            onClick={() => navigate('/chat')}
            style={{
              padding: '14px 20px',
              borderRadius: '24px',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
        </div>

        {/* Кнопка выхода */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '24px',
            backgroundColor: 'transparent',
            color: '#ef4444',
            border: '1px solid #ef4444',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          🚪 Выйти из аккаунта
        </button>
      </motion.div>
    </div>
  );
}
