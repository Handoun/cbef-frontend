import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Avatar from './Avatar';

const API_URL = import.meta.env.VITE_API_URL;

const styles: any = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F2027 0%, #2C5364 100%)', padding: 16 },
  card: { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', padding: 32, borderRadius: 32, boxShadow: '0 30px 50px rgba(0,0,0,0.2)', width: '100%', maxWidth: 500, color: '#1a1a1a' },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 24, textAlign: 'center', color: '#1F2A3E' },
  avatarSection: { display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28 },
  fileInput: { display: 'none' },
  uploadButton: { padding: '10px 18px', background: '#2C3E50', color: 'white', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 500 },
  inputGroup: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#2C3E50' },
  input: { width: '100%', padding: 14, border: '1px solid #ddd', borderRadius: 40, fontSize: 16, backgroundColor: 'white' },
  themeToggle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  themeButton: { padding: '10px 20px', backgroundColor: '#2C3E50', color: 'white', border: 'none', borderRadius: 30, cursor: 'pointer' },
  buttonGroup: { display: 'flex', gap: 12, marginTop: 30 },
  saveButton: { flex: 1, padding: 14, backgroundColor: '#0084ff', color: 'white', border: 'none', borderRadius: 40, fontWeight: 600, cursor: 'pointer' },
  cancelButton: { flex: 1, padding: 14, backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: 40, fontWeight: 600, cursor: 'pointer' },
  logoutButton: { width: '100%', padding: 14, marginTop: 20, backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: 40, fontWeight: 600, cursor: 'pointer' },
  subBlock: { marginTop: 20, padding: 16, border: '1px solid #ddd', borderRadius: 20, background: '#f9f9f9' },
  themeOption: { marginRight: 8, padding: '6px 12px', borderRadius: 20, border: '1px solid #ccc', background: 'white', cursor: 'pointer' },
};

export default function Settings() {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>('light');
  const [sessions, setSessions] = useState<any[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [subscription, setSubscription] = useState<string | null>(null);
  const [premiumOnly, setPremiumOnly] = useState<boolean>(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isPremiumUser = currentUser.premium === true;

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUsername(user.username);
    }
    const savedAvatar = localStorage.getItem('avatar');
    if (savedAvatar) setAvatar(savedAvatar);
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (token) {
      axios.get(`${API_URL}/api/sessions`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setSessions(res.data))
        .catch(console.error);
      axios.get(`${API_URL}/api/subscription`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setSubscription(res.data.subscription_until))
        .catch(console.error);
      axios.get(`${API_URL}/api/users/${currentUser.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setPremiumOnly(res.data.premium_only_messages || false))
        .catch(console.error);
    }
  }, [token, currentUser.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* без изменений */ };
  const removeSession = async (id: number) => { /* без изменений */ };

  const togglePremiumOnly = async () => {
    const newVal = !premiumOnly;
    setPremiumOnly(newVal);
    await axios.put(`${API_URL}/api/users/premium-only`, { enabled: newVal }, { headers: { Authorization: `Bearer ${token}` } });
  };

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSave = async () => { /* без изменений */ };
  const handleLogout = () => { /* без изменений */ };

  const themes = ['light', 'dark', 'ocean', 'forest', 'sunset'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>⚙️ Настройки</h2>

        {/* Аватар */}
        <div style={styles.avatarSection}>
          {avatar ? <img src={avatar} alt="avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} /> : <Avatar name={username} size={100} />}
          <div>
            <input type="file" accept="image/*" id="avatarUpload" style={styles.fileInput} onChange={handleAvatarChange} />
            <label htmlFor="avatarUpload" style={styles.uploadButton}>Загрузить фото</label>
          </div>
        </div>

        {/* Имя */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Имя пользователя</label>
          <input style={styles.input} value={username} onChange={e => setUsername(e.target.value)} />
        </div>

        {/* Темы */}
        <div style={styles.themeToggle}>
          <span>Тема</span>
          <div>
            {themes.map(t => (
              <button key={t} style={{ ...styles.themeOption, background: theme === t ? '#2C3E50' : 'white', color: theme === t ? 'white' : '#333' }} onClick={() => changeTheme(t)}>
                {t === 'light' ? '☀️ Светлая' : t === 'dark' ? '🌙 Тёмная' : t === 'ocean' ? '🌊 Океан' : t === 'forest' ? '🌲 Лес' : '🌅 Закат'}
              </button>
            ))}
          </div>
        </div>

        {/* Режим "писать только Premium" */}
        {isPremiumUser && (
          <div style={styles.themeToggle}>
            <span>Принимать сообщения только от Premium</span>
            <button style={styles.themeButton} onClick={togglePremiumOnly}>{premiumOnly ? 'Вкл' : 'Выкл'}</button>
          </div>
        )}

        {/* Устройства */}
        <div style={styles.themeToggle}>
          <span>Устройства</span>
          <button style={styles.themeButton} onClick={() => setShowSessions(!showSessions)}>Показать</button>
        </div>
        {showSessions && (
          <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 12, padding: 8 }}>
            {sessions.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span>{s.device_info || 'Неизвестное устройство'}</span>
                <button onClick={() => removeSession(s.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>Выйти</button>
              </div>
            ))}
          </div>
        )}

        {/* Подписка */}
        <div style={styles.subBlock}>
          <h4>Подписка CBEF Premium</h4>
          {subscription ? (
            <p>Активна до: {new Date(subscription).toLocaleDateString()}</p>
          ) : (
            <p>Подписка не активна</p>
          )}
          {isPremiumUser ? (
            <p style={{ fontSize: 14, color: '#0084ff' }}>Вы Premium. Спасибо за поддержку!</p>
          ) : (
            <p style={{ fontSize: 14, color: '#666' }}>Для оформления подписки обратитесь к администратору.</p>
          )}
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.saveButton} onClick={handleSave}>Сохранить</button>
          <button style={styles.cancelButton} onClick={() => navigate('/chat')}>Отмена</button>
        </div>

        <button style={styles.logoutButton} onClick={handleLogout}>Выйти</button>
      </div>
    </motion.div>
  );
}