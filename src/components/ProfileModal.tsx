import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Avatar from './Avatar';

const API_URL = import.meta.env.VITE_API_URL;

export default function ProfileModal({ userId, token, onClose }: { userId: number; token: string; onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { setProfile(res.data); setBio(res.data.bio || ''); })
      .catch(console.error);
  }, [userId, token]);

  const saveBio = async () => {
    await axios.put(`${API_URL}/api/users/profile`, { bio }, { headers: { Authorization: `Bearer ${token}` } });
    onClose();
  };

  if (!profile) return <div>Загрузка...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
    }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{
        background: 'var(--sidebar-bg)', padding: 24, borderRadius: 24, width: '90%', maxWidth: 400,
        color: 'var(--text-primary)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Avatar src={profile.avatar} name={profile.username} size={80} />
          <h3 style={{ marginTop: 12 }}>{profile.username}</h3>
          {profile.is_admin && <span style={{ color: '#0084ff' }}>Администратор</span>}
        </div>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="О себе..."
          rows={3}
          style={{ width: '100%', padding: 12, borderRadius: 20, border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveBio} style={{ flex: 1, padding: 10, borderRadius: 20, background: '#0084ff', color: 'white', border: 'none', fontWeight: 600 }}>Сохранить</button>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 20, background: 'var(--button-bg)', color: 'var(--button-text)', border: 'none' }}>Закрыть</button>
        </div>
      </motion.div>
    </motion.div>
  );
}