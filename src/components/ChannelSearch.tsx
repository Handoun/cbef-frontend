import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

interface ChannelSearchProps {
  token: string;
  onClose: () => void;
  onSubscribed: () => void;
}

export default function ChannelSearch({ token, onClose, onSubscribed }: ChannelSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const res = await axios.get(`${API_URL}/api/channels/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const subscribe = async (channelId: number) => {
    try {
      await axios.post(`${API_URL}/api/channels/${channelId}/subscribe`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Подписка оформлена');
      setTimeout(() => {
        setMessage('');
        onSubscribed();
        onClose();
      }, 1000);
    } catch (err) {
      setMessage('Ошибка подписки');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 2500,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        style={{
          background: 'var(--sidebar-bg)', padding: 24, borderRadius: 24,
          width: '90%', maxWidth: 450, color: 'var(--text-primary)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3>🔍 Поиск каналов</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            style={{ flex: 1, padding: 10, borderRadius: 20, border: '1px solid var(--border-color)' }}
            placeholder="Название канала"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} style={{ padding: '0 16px', borderRadius: 20, background: '#0084ff', color: 'white', border: 'none' }}>Найти</button>
        </div>
        {message && <p>{message}</p>}
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {results.map(channel => (
            <div key={channel.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>{channel.name} ({channel.subscribers_count} подп.)</span>
              <button onClick={() => subscribe(channel.id)} style={{ padding: '6px 12px', borderRadius: 20, background: '#4caf50', color: 'white', border: 'none' }}>Подписаться</button>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop: 12, width: '100%', padding: 10, borderRadius: 20, background: 'var(--button-bg)', color: 'var(--button-text)', border: 'none' }}>Закрыть</button>
      </motion.div>
    </motion.div>
  );
}