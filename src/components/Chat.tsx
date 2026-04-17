import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { Peer } from 'peerjs';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const PEER_HOST = import.meta.env.VITE_PEER_HOST;
const PEER_PORT = import.meta.env.VITE_PEER_PORT;
const PEER_PATH = import.meta.env.VITE_PEER_PATH;

// Стили с поддержкой CSS-переменных и адаптивностью
const styles: { [key: string]: React.CSSProperties & { [key: string]: any } } = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: 'var(--bg-color)',
    transition: 'background-color 0.2s ease',
  },
  sidebar: {
    width: '30%',
    minWidth: 280,
    maxWidth: 400,
    backgroundColor: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s ease',
  },
  sidebarHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--header-bg)',
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  contactList: {
    flex: 1,
    overflowY: 'auto',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border-color)',
    transition: 'background-color 0.15s ease',
  },
  contactInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  contactName: {
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: '#4caf50',
    boxShadow: '0 0 0 2px var(--sidebar-bg)',
  },
  offlineDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: 'var(--text-secondary)',
    boxShadow: '0 0 0 2px var(--sidebar-bg)',
  },
  addButton: {
    backgroundColor: 'var(--button-bg)',
    border: 'none',
    borderRadius: '24px',
    padding: '6px 14px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--button-text)',
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--chat-bg)',
    backgroundImage: 'var(--chat-pattern)',
  },
  chatHeader: {
    padding: '16px 20px',
    backgroundColor: 'var(--header-bg)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatHeaderTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  callButton: {
    backgroundColor: 'var(--button-bg)',
    border: 'none',
    borderRadius: '30px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--button-text)',
  },
  hangUpButton: {
    backgroundColor: '#ff4d4f',
    color: '#fff',
    border: 'none',
    borderRadius: '30px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  messageRow: {
    display: 'flex',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: '20px',
    fontSize: '15px',
    lineHeight: 1.4,
    wordBreak: 'break-word',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  messageOwn: {
    backgroundColor: 'var(--message-own-bg)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
    color: 'var(--text-primary)',
  },
  messageOther: {
    backgroundColor: 'var(--message-other-bg)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
    color: 'var(--text-primary)',
  },
  inputContainer: {
    padding: '16px 20px',
    backgroundColor: 'var(--header-bg)',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '12px 18px',
    border: '1px solid var(--border-color)',
    borderRadius: '30px',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  sendButton: {
    backgroundColor: '#0084ff',
    color: '#fff',
    border: 'none',
    borderRadius: '30px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  emptyChat: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    fontSize: '16px',
    backgroundColor: 'var(--chat-bg)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalBox: {
    backgroundColor: 'var(--sidebar-bg)',
    padding: '30px 40px',
    borderRadius: '24px',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    color: 'var(--text-primary)',
    maxWidth: '90%',
  },
  modalTitle: {
    margin: '0 0 16px 0',
    fontSize: '24px',
    fontWeight: 600,
  },
  modalText: {
    margin: '0 0 24px 0',
    color: 'var(--text-secondary)',
  },
  modalButton: {
    margin: '0 8px',
    padding: '12px 28px',
    fontSize: '16px',
    borderRadius: '40px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
  },
  acceptButton: {
    backgroundColor: '#0084ff',
    color: '#fff',
  },
  declineButton: {
    backgroundColor: 'var(--button-bg)',
    color: 'var(--button-text)',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    fontSize: '26px',
    cursor: 'pointer',
    padding: '8px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentMenu: {
    position: 'absolute',
    bottom: '80px',
    left: '20px',
    backgroundColor: 'var(--sidebar-bg)',
    borderRadius: '20px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    padding: '12px',
    display: 'flex',
    gap: '12px',
    zIndex: 10,
  },
  stickerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    padding: '12px',
  },
  sticker: {
    fontSize: '36px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '0 16px 0 0',
    color: 'var(--text-secondary)',
    display: 'none',
  },
  // Медиа-запросы будут обрабатываться через JS (см. логику адаптивности)
};

interface User { id: number; username: string; }
interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  text: string;
  image?: string;
  audio?: string;
  created_at: string;
}

export default function Chat() {
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [peer, setPeer] = useState<Peer | null>(null);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ call: any; from: string } | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Адаптивность
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        if (selectedUser) setShowSidebar(false);
        else setShowSidebar(true);
      } else {
        setShowSidebar(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedUser]);

  useEffect(() => {
    if (isMobile && selectedUser) setShowSidebar(false);
  }, [selectedUser, isMobile]);

  const handleBackToContacts = () => {
    setSelectedUser(null);
    setShowSidebar(true);
  };

  // Загрузка данных
  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(res.data)).catch(console.error);
    axios.get(`${API_URL}/api/contacts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setContacts(res.data)).catch(console.error);
  }, [token]);

  // Socket.IO
  useEffect(() => {
    const newSocket = io(SOCKET_URL, { auth: { token }, transports: ['polling'] });
    setSocket(newSocket);
    newSocket.on('connect', () => console.log('Socket connected'));
    newSocket.on('private_message', (msg: Message) => {
      if (selectedUser && (msg.sender_id === selectedUser.id || msg.sender_id === currentUser.id)) {
        setMessages(prev => [...prev, msg]);
      }
    });
    newSocket.on('user_status', ({ userId, online }: { userId: number, online: boolean }) => {
      setOnlineUsers(prev => { const next = new Set(prev); online ? next.add(userId) : next.delete(userId); return next; });
    });
    return () => { newSocket.disconnect(); };
  }, [token, currentUser.id, selectedUser]);

  // PeerJS
  useEffect(() => {
    const newPeer = new Peer(currentUser.id.toString(), {
      host: PEER_HOST,
      port: parseInt(PEER_PORT),
      path: PEER_PATH,
      secure: true,
    });
    setPeer(newPeer);
    newPeer.on('open', (id) => console.log('PeerJS connected with ID:', id));
    newPeer.on('call', (call) => { setIncomingCall({ call, from: call.peer }); });
    return () => { newPeer.destroy(); };
  }, [currentUser.id]);

  // История сообщений
  useEffect(() => {
    if (!selectedUser) return;
    axios.get(`${API_URL}/api/messages/${selectedUser.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setMessages(res.data)).catch(console.error);
  }, [selectedUser, token]);

  const sendMessage = (extra?: { image?: string; audio?: string }) => {
    if (!selectedUser || !socket) return;
    const text = input.trim();
    if (!text && !extra) return;
    socket.emit('private_message', { to: selectedUser.id, text, ...extra });
    setInput('');
    setShowEmoji(false);
  };

  const startCall = async () => {
    if (!selectedUser || !peer) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      const call = peer.call(selectedUser.id.toString(), stream);
      setCurrentCall(call);
      call.on('stream', (remoteStream: MediaStream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(console.error);
        }
      });
      call.on('close', () => { setCurrentCall(null); stopLocalStream(); });
    } catch (err) { alert('Не удалось начать звонок. Проверьте микрофон.'); }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      incomingCall.call.answer(stream);
      setCurrentCall(incomingCall.call);
      incomingCall.call.on('stream', (remoteStream: MediaStream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(console.error);
        }
      });
      incomingCall.call.on('close', () => { setCurrentCall(null); stopLocalStream(); });
      setIncomingCall(null);
    } catch (err) { alert('Не удалось принять звонок.'); setIncomingCall(null); }
  };

  const declineCall = () => { if (incomingCall) { incomingCall.call.close(); setIncomingCall(null); } };
  const hangUp = () => { if (currentCall) { currentCall.close(); setCurrentCall(null); } stopLocalStream(); };
  const stopLocalStream = () => {
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); setLocalStream(null); }
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  };

  const addContact = (userId: number) => {
    axios.post(`${API_URL}/api/contacts`, { contactId: userId }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => { const newContact = users.find(u => u.id === userId); if (newContact) setContacts(prev => [...prev, newContact]); })
      .catch(console.error);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => sendMessage({ image: reader.result as string });
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => sendMessage({ audio: reader.result as string });
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch { alert('Нет доступа к микрофону'); }
  };
  const stopRecording = () => { mediaRecorder?.stop(); setRecording(false); };

  const stickers = ['😊', '😂', '😍', '👍', '🎉', '🔥', '❤️', '💯'];
  const sendSticker = (sticker: string) => { setInput(sticker); sendMessage(); setShowStickers(false); };

  const displayedContacts = contacts.length ? contacts : users.filter(u => u.id !== currentUser.id);

  return (
    <div style={styles.container}>
      <AnimatePresence>
        {incomingCall && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.modalOverlay}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={styles.modalBox}>
              <h3 style={styles.modalTitle}>📞 Входящий звонок</h3>
              <p style={styles.modalText}>Пользователь ID: {incomingCall.from}</p>
              <button style={{ ...styles.modalButton, ...styles.acceptButton }} onClick={acceptCall}>Принять</button>
              <button style={{ ...styles.modalButton, ...styles.declineButton }} onClick={declineCall}>Отклонить</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Боковая панель */}
      {(showSidebar || !isMobile) && (
        <motion.div
          initial={isMobile ? { x: -300 } : false}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            ...styles.sidebar,
            ...(isMobile && { position: 'absolute', zIndex: 20, height: '100%', width: '100%', maxWidth: '100%' }),
          }}
        >
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>💬 CBEF</h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{currentUser.username}</span>
              <button onClick={() => window.location.hash = '#/settings'} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-secondary)' }}>⚙️</button>
            </p>
          </div>
          <div style={styles.contactList}>
            {displayedContacts.map(user => (
              <div
                key={user.id}
                style={{ ...styles.contactItem, backgroundColor: selectedUser?.id === user.id ? 'var(--hover-bg)' : 'transparent' }}
                onClick={() => setSelectedUser(user)}
              >
                <div style={styles.contactInfo}>
                  <span style={onlineUsers.has(user.id) ? styles.onlineDot : styles.offlineDot} />
                  <span style={styles.contactName}>{user.username}</span>
                </div>
                {!contacts.some(c => c.id === user.id) && (
                  <button style={styles.addButton} onClick={(e) => { e.stopPropagation(); addContact(user.id); }}>+</button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Чат */}
      <div style={{
        ...styles.chatArea,
        ...(isMobile && !showSidebar ? { display: 'flex' } : { display: isMobile ? 'none' : 'flex' }),
      }}>
        {selectedUser ? (
          <>
            <div style={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {isMobile && (
                  <button style={styles.backButton} onClick={handleBackToContacts}>←</button>
                )}
                <h3 style={styles.chatHeaderTitle}>
                  {selectedUser.username}
                  <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 400 }}>
                    {onlineUsers.has(selectedUser.id) ? '🟢 онлайн' : '⚫ офлайн'}
                  </span>
                </h3>
              </div>
              <div>
                {!currentCall ? (
                  <button style={styles.callButton} onClick={startCall}>📞 Позвонить</button>
                ) : (
                  <button style={styles.hangUpButton} onClick={hangUp}>❌ Завершить</button>
                )}
              </div>
            </div>
            <div style={styles.messagesContainer}>
              <AnimatePresence>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{ ...styles.messageRow, justifyContent: msg.sender_id === currentUser.id ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{ ...styles.messageBubble, ...(msg.sender_id === currentUser.id ? styles.messageOwn : styles.messageOther) }}>
                      {msg.image && <img src={msg.image} alt="sent" style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 4 }} />}
                      {msg.audio && <audio controls src={msg.audio} style={{ maxWidth: 200 }} />}
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div style={styles.inputContainer}>
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
              <button style={styles.iconButton} onClick={() => setShowAttachment(!showAttachment)}>📎</button>
              {showAttachment && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={styles.attachmentMenu}>
                  <button style={styles.iconButton} onClick={() => fileInputRef.current?.click()}>🖼️</button>
                  <button style={styles.iconButton} onClick={() => { setShowStickers(!showStickers); }}>😀</button>
                  {recording ? <button style={styles.iconButton} onClick={stopRecording}>⏹️</button> : <button style={styles.iconButton} onClick={startRecording}>🎤</button>}
                </motion.div>
              )}
              <button style={styles.iconButton} onClick={() => setShowEmoji(!showEmoji)}>😊</button>
              <input
                style={styles.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Сообщение"
              />
              <button style={styles.sendButton} onClick={() => sendMessage()}>Отправить</button>
            </div>
            {showEmoji && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'absolute', bottom: 90, right: 20, zIndex: 30 }}>
                <EmojiPicker onEmojiClick={(e) => setInput(prev => prev + e.emoji)} />
              </motion.div>
            )}
            {showStickers && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...styles.attachmentMenu, bottom: 130 }}>
                <div style={styles.stickerGrid}>
                  {stickers.map(s => <div key={s} style={styles.sticker} onClick={() => sendSticker(s)}>{s}</div>)}
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <div style={styles.emptyChat}>Выберите контакт</div>
        )}
      </div>
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}