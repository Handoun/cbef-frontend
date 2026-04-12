import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

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
    maxWidth: '400px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    marginBottom: '30px',
    textAlign: 'center',
    color: '#333',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border 0.2s',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  link: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666',
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: '15px',
  },
};

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/register`, { username, password });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Регистрация</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <input
              style={styles.input}
              type="text"
              placeholder="Логин"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <input
              style={styles.input}
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button style={styles.button} type="submit">Зарегистрироваться</button>
        </form>
        <div style={styles.link}>
          Уже есть аккаунт? <Link to="/login" style={{ color: '#667eea' }}>Войти</Link>
        </div>
      </div>
    </div>
  );
}