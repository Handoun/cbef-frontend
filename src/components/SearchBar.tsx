import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

interface User {
  id: number;
  username: string;
  avatar?: string;
}

interface SearchBarProps {
  token: string;
  onClose: () => void;
}

export default function SearchBar({ token, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      await axios.post(`${API_URL}/api/friend-requests`, { toId: userId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Заявка отправлена');
      setTimeout(() => setMessage(''), 2000);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Ошибка');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        style={{
          background: 'var(--sidebar-bg)', borderRadius: 24,
          padding: 24, width: '90%', maxWidth: 400,
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 16 }}>🔍 Найти друзей</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{
              flex: 1, padding: 12, borderRadius: 40, border: '1px solid var(--border-color)',
              backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)',
            }}
            placeholder="Введите логин"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} style={{
            padding: '0 20px', borderRadius: 40, background: '#0084ff', color: 'white',
            border: 'none', fontWeight: 600,
          }}>Найти</button>
        </div>
        {message && <p style={{ marginTop: 12, color: 'green' }}>{message}</p>}
        {loading && <p>Загрузка...</p>}
        <div style={{ marginTop: 16, maxHeight: 300, overflowY: 'auto' }}>
          <AnimatePresence>
            {results.map(user => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={user.avatar || 'https://via.placeholder.com/40?text=?'} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <span>{user.username}</span>
                </div>
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, background: 'var(--button-bg)',
                    color: 'var(--button-text)', border: 'none', cursor: 'pointer',
                  }}
                >Добавить</button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <button onClick={onClose} style={{ marginTop: 20, width: '100%', padding: 12, borderRadius: 40, background: 'var(--button-bg)' }}>Закрыть</button>
      </motion.div>
    </motion.div>
  );
}