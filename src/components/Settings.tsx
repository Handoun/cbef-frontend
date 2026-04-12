import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Segoe UI, Roboto, sans-serif',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    marginBottom: '30px',
    textAlign: 'center',
    color: '#333',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #e0e0e0',
  },
  fileInput: {
    display: 'none',
  },
  uploadButton: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#555',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '30px',
  },
  saveButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#0084ff',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#e4e6eb',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  logoutButton: {
    width: '100%',
    padding: '14px',
    marginTop: '20px',
    backgroundColor: '#ff4d4f',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  themeToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  themeLabel: {
    color: '#555',
    fontWeight: 500,
  },
  themeButton: {
    padding: '8px 16px',
    backgroundColor: '#e4e6eb',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
};

export default function Settings() {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUsername(user.username);
    }
    const savedAvatar = localStorage.getItem('avatar');
    if (savedAvatar) setAvatar(savedAvatar);

    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatar(base64);
        localStorage.setItem('avatar', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSave = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.username = username;
    localStorage.setItem('user', JSON.stringify(user));
    alert('Настройки сохранены');
    navigate('/chat');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>⚙️ Настройки</h2>

        <div style={styles.avatarSection}>
          <img
            src={avatar || 'https://via.placeholder.com/100?text=Avatar'}
            style={styles.avatar}
            alt="Аватар"
          />
          <div>
            <input
              type="file"
              accept="image/*"
              id="avatarUpload"
              style={styles.fileInput}
              onChange={handleAvatarChange}
            />
            <label htmlFor="avatarUpload" style={styles.uploadButton}>
              Загрузить фото
            </label>
            <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
              JPG, PNG (сохраняется локально)
            </p>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Имя пользователя</label>
          <input
            style={styles.input}
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Ваше имя"
          />
        </div>

        <div style={styles.themeToggle}>
          <span style={styles.themeLabel}>Тема оформления</span>
          <button style={styles.themeButton} onClick={toggleTheme}>
            {theme === 'light' ? '☀️ Светлая' : '🌙 Тёмная'}
          </button>
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.saveButton} onClick={handleSave}>
            Сохранить
          </button>
          <button style={styles.cancelButton} onClick={() => navigate('/chat')}>
            Отмена
          </button>
        </div>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
