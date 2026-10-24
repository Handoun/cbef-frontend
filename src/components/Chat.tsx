import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { Peer } from 'peerjs';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddFriend from './AddFriend';
import FriendRequests from './FriendRequests';
import CallWindow from './CallWindow';
import GroupCreator from './GroupCreator';
import ChannelCreator from './ChannelCreator';
import StickerManager from './StickerManager';
import StickerPackViewer from './StickerPackViewer';
import AdminPanel from './AdminPanel';
import Avatar from './Avatar';
import UpdateBanner from './UpdateBanner';
import DevicePrompt from './DevicePrompt';
import ImageLightbox from './ImageLightbox';
import ChannelSearch from './ChannelSearch';
import ProfileModal from './ProfileModal';

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const PEER_HOST = import.meta.env.VITE_PEER_HOST;
const PEER_PORT = import.meta.env.VITE_PEER_PORT;
const PEER_PATH = import.meta.env.VITE_PEER_PATH;

const styles: { [key: string]: React.CSSProperties & { [key: string]: any } } = {
  container: { display: 'flex', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: 'var(--bg-color)', transition: 'background-color 0.2s ease' },
  sidebar: { width: '30%', minWidth: 280, maxWidth: 400, backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease' },
  sidebarPhone: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '100%', maxWidth: '100%', zIndex: 20, backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease' },
  sidebarHeader: { padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--header-bg)' },
  sidebarTitle: { margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' },
  contactList: { flex: 1, overflowY: 'auto' },
  contactItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s ease' },
  contactInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  contactName: { fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' },
  onlineDot: { width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4caf50', boxShadow: '0 0 0 2px var(--sidebar-bg)' },
  offlineDot: { width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--text-secondary)', boxShadow: '0 0 0 2px var(--sidebar-bg)' },
  addButton: { backgroundColor: 'var(--button-bg)', border: 'none', borderRadius: '24px', padding: '6px 14px', fontSize: '14px', fontWeight: 500, color: 'var(--button-text)', cursor: 'pointer', transition: 'opacity 0.15s ease' },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--chat-bg)', backgroundImage: 'var(--chat-pattern)' },
  chatHeader: { padding: '16px 20px', backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  chatHeaderTitle: { margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' },
  callButton: { backgroundColor: 'var(--button-bg)', border: 'none', borderRadius: '30px', padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--button-text)' },
  hangUpButton: { backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '30px', padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  messagesContainer: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  messageRow: { display: 'flex', alignItems: 'flex-end' },
  messageBubble: { maxWidth: '75%', padding: '10px 14px', borderRadius: '20px', fontSize: '15px', lineHeight: 1.4, wordBreak: 'break-word', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  messageOwn: { backgroundColor: 'var(--message-own-bg)', alignSelf: 'flex-end', borderBottomRightRadius: '4px', color: 'var(--text-primary)' },
  messageOther: { backgroundColor: 'var(--message-other-bg)', alignSelf: 'flex-start', borderBottomLeftRadius: '4px', color: 'var(--text-primary)' },
  inputContainer: { padding: '16px 20px', backgroundColor: 'var(--header-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' },
  input: { flex: 1, padding: '12px 18px', border: '1px solid var(--border-color)', borderRadius: '30px', fontSize: '15px', outline: 'none', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' },
  sendButton: { backgroundColor: '#0084ff', color: '#fff', border: 'none', borderRadius: '30px', padding: '12px 24px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' },
  emptyChat: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '16px', backgroundColor: 'var(--chat-bg)' },
  iconButton: { background: 'none', border: 'none', fontSize: '26px', cursor: 'pointer', padding: '8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  attachmentMenu: { position: 'absolute', bottom: '80px', left: '20px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: '12px', display: 'flex', gap: '12px', zIndex: 10 },
  stickerGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '4px' },
  sticker: { fontSize: '24px', cursor: 'pointer', textAlign: 'center', padding: 4, borderRadius: 8, transition: 'background-color 0.15s ease' },
  backButton: { background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', padding: '0 16px 0 0', color: 'var(--text-secondary)', display: 'block' },
  badge: { backgroundColor: 'red', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginLeft: 8 },
  ttlButton: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)', padding: '0 8px' },
};

interface User { id: number; username: string; avatar?: string; is_admin?: boolean; banned?: boolean; bio?: string; premium?: boolean; }
interface Message { id: number; sender_id: number; receiver_id: number; group_id?: number; channel_id?: number; text: string; image?: string; audio?: string; status?: string; created_at: string; expires_at?: string; }

export default function Chat() {
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [channelMessages, setChannelMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [ttl, setTtl] = useState<number>(0); // 0 = выкл
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [peer, setPeer] = useState<Peer | null>(null);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ call: any; from: string } | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneNodesRef = useRef<any[]>([]);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showStickerManager, setShowStickerManager] = useState(false);
  const [showStickerPack, setShowStickerPack] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showChannelSearch, setShowChannelSearch] = useState(false);
  const [showDevicePrompt, setShowDevicePrompt] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [deviceType, setDeviceType] = useState<'phone' | 'desktop'>('desktop');
  const [refreshContacts, setRefreshContacts] = useState(0);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [lastMessageTimes, setLastMessageTimes] = useState<Record<number, string>>({});
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [showChannelCreator, setShowChannelCreator] = useState(false);
  const [channelSubscribersCount, setChannelSubscribersCount] = useState<number>(0);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const isAdmin = currentUser.isAdmin === true;
  const isPremium = currentUser.premium === true;

  const scrollToBottom = () => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { scrollToBottom(); }, [messages, groupMessages, channelMessages]);

  // Проверка выбора устройства при первом входе
  useEffect(() => {
    const devicePref = localStorage.getItem('devicePreference');
    if (!devicePref) {
      setShowDevicePrompt(true);
    } else {
      setDeviceType(devicePref as 'phone' | 'desktop');
    }
  }, []);

  // Сброс сообщений при смене чата
  useEffect(() => {
    setMessages([]);
    setGroupMessages([]);
    setChannelMessages([]);
  }, [selectedUser?.id, selectedGroup?.id, selectedChannel?.id]);

  // Скрытие сайдбара при открытом чате
  useEffect(() => {
    if (selectedUser || selectedGroup || selectedChannel) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
    }
  }, [selectedUser, selectedGroup, selectedChannel]);

  const handleDeviceSelect = (device: 'desktop' | 'phone') => {
    localStorage.setItem('devicePreference', device);
    setDeviceType(device);
    setShowDevicePrompt(false);
    setShowSidebar(true);
  };

  const openDevicePrompt = () => setShowDevicePrompt(true);

  const handleBackToContacts = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
    setSelectedChannel(null);
    setShowSidebar(true);
  };

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setUsers(r.data)).catch(console.error);
    axios.get(`${API_URL}/api/contacts`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setContacts(r.data)).catch(console.error);
    axios.get(`${API_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setGroups(r.data)).catch(console.error);
    axios.get(`${API_URL}/api/channels`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setChannels(r.data)).catch(console.error);
  }, [token, refreshContacts]);

  // Запрос разрешения на уведомления
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const notify = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  useEffect(() => {
    const newSocket = io(SOCKET_URL, { auth: { token }, transports: ['polling'] });
    setSocket(newSocket);
    newSocket.on('connect', () => console.log('Socket connected'));
    newSocket.on('private_message', (msg: Message) => {
      if (selectedUser && (msg.sender_id === selectedUser.id || msg.sender_id === currentUser.id)) {
        setMessages(prev => [...prev, msg]);
      } else if (msg.sender_id !== currentUser.id) {
        notify('Новое сообщение', 'Вам пришло личное сообщение');
        setUnreadCounts(prev => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }));
        setLastMessageTimes(prev => ({ ...prev, [msg.sender_id]: msg.created_at }));
      }
    });
    newSocket.on('group_message', (msg: Message) => {
      if (selectedGroup && msg.group_id === selectedGroup.id) {
        setGroupMessages(prev => [...prev, msg]);
      } else {
        notify('Новое сообщение', 'Новое сообщение в группе');
      }
    });
    newSocket.on('channel_message', (msg: Message) => {
      if (selectedChannel && msg.channel_id === selectedChannel.id) {
        setChannelMessages(prev => [...prev, msg]);
      } else {
        notify('Новое сообщение', 'Новое сообщение в канале');
      }
    });
    newSocket.on('user_status', ({ userId, online }: { userId: number, online: boolean }) => {
      setOnlineUsers(prev => { const n = new Set(prev); online ? n.add(userId) : n.delete(userId); return n; });
    });
    newSocket.on('friend_request', ({ fromName }: { fromName: string }) => { alert(`Новая заявка от ${fromName}`); setRefreshContacts(p => p + 1); });
    newSocket.on('friend_request_accepted', ({ byName }: { byName: string }) => { alert(`${byName} принял заявку`); setRefreshContacts(p => p + 1); });
    newSocket.on('message_status', ({ receiverId, status }: { receiverId: number; status: string }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.receiver_id === receiverId && msg.sender_id === currentUser.id && msg.status !== 'read') {
          return { ...msg, status };
        }
        return msg;
      }));
    });
    newSocket.on('banned', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
      alert('Ваш аккаунт заблокирован администратором.');
    });
    newSocket.on('error', (error: string) => {
      alert(error);
    });
    return () => { newSocket.disconnect(); };
  }, [token, currentUser.id, selectedUser, selectedGroup, selectedChannel]);

  useEffect(() => {
    const newPeer = new Peer(currentUser.id.toString(), {
      host: PEER_HOST, port: parseInt(PEER_PORT), path: PEER_PATH, secure: true,
    });
    setPeer(newPeer);
    newPeer.on('open', (id) => console.log('PeerJS:', id));
    newPeer.on('call', (call) => setIncomingCall({ call, from: call.peer }));
    return () => newPeer.destroy();
  }, [currentUser.id]);

  useEffect(() => {
    if (!selectedUser) return;
    axios.get(`${API_URL}/api/messages/${selectedUser.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => {
      const fixed = r.data.map((m: Message) => {
        if (m.image && !m.image.startsWith('data:image') && !m.image.startsWith('http')) {
          return { ...m, text: m.image, image: undefined };
        }
        return m;
      });
      setMessages(fixed);
      setUnreadCounts(prev => ({ ...prev, [selectedUser.id]: 0 }));
      axios.put(`${API_URL}/api/messages/${selectedUser.id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(console.error);
    }).catch(console.error);
  }, [selectedUser, token]);

  useEffect(() => {
    if (!selectedGroup) return;
    axios.get(`${API_URL}/api/groups/${selectedGroup.id}/messages`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setGroupMessages(r.data)).catch(console.error);
  }, [selectedGroup, token]);

  useEffect(() => {
    if (!selectedChannel) return;
    axios.get(`${API_URL}/api/channels/${selectedChannel.id}/messages`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setChannelMessages(r.data)).catch(console.error);
    axios.get(`${API_URL}/api/channels/${selectedChannel.id}/subscribers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setChannelSubscribersCount(r.data.count)).catch(console.error);
  }, [selectedChannel, token]);

  const sendMessage = (extra?: { image?: string; audio?: string }) => {
    if (!socket) return;
    const text = input.trim();
    if (!text && !extra) return;
    if (selectedUser) {
      socket.emit('private_message', { to: selectedUser.id, text, ttl, ...extra });
    } else if (selectedGroup) {
      socket.emit('group_message', { groupId: selectedGroup.id, text, ...extra });
    } else if (selectedChannel) {
      socket.emit('channel_message', { channelId: selectedChannel.id, text, ...extra });
    }
    setInput('');
    setShowEmoji(false);
    setTtl(0);
  };

  const copyChannelInviteLink = () => {
    if (!selectedChannel) return;
    const link = `${window.location.origin}/#/channel/${selectedChannel.id}`;
    navigator.clipboard.writeText(link).then(() => alert('Ссылка скопирована!')).catch(() => prompt('Скопируйте ссылку вручную:', link));
  };

  // --- Звук звонка ---
  const startRingtone = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      gain.gain.value = 0.05;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      const interval = setInterval(() => {
        if (gain.gain.value > 0) gain.gain.value = 0;
        else gain.gain.value = 0.05;
      }, 500);
      ringtoneNodesRef.current = [oscillator, gain, interval];
      if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
    } catch (err) { console.warn('Не удалось запустить звонок:', err); }
  };

  const stopRingtone = () => {
    if (ringtoneNodesRef.current.length) {
      const [osc, gain, interval] = ringtoneNodesRef.current;
      clearInterval(interval);
      gain.disconnect();
      osc.stop();
      osc.disconnect();
      ringtoneNodesRef.current = [];
    }
  };

  useEffect(() => {
    if (incomingCall && !currentCall) startRingtone();
    else stopRingtone();
    return () => stopRingtone();
  }, [incomingCall, currentCall]);

  useEffect(() => {
    const unlock = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      document.removeEventListener('pointerdown', unlock);
    };
    document.addEventListener('pointerdown', unlock);
    return () => document.removeEventListener('pointerdown', unlock);
  }, []);
  // --- Конец звука ---

  const startCall = async () => {
    stopRingtone();
    if (!peer || (!selectedUser && !selectedGroup)) return;
    let stream: MediaStream | null = null;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); }
    catch { try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { alert('Нет доступа к микрофону/камере. Звонок будет без медиа.'); } }
    if (stream) { setLocalStream(stream); setAudioEnabled(true); setVideoEnabled(true); }
    const targetId = selectedUser ? selectedUser.id.toString() : `group_${selectedGroup?.id}`;
    const call = peer.call(targetId, stream || undefined);
    if (call) { setCurrentCall(call); call.on('stream', (rs: MediaStream) => setRemoteStream(rs)); call.on('close', () => { setCurrentCall(null); stopLocalStream(); }); }
  };

  const acceptCall = async () => {
    stopRingtone();
    if (!incomingCall) return;
    let stream: MediaStream | null = null;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); }
    catch { try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { alert('Нет доступа к микрофону'); } }
    if (stream) { setLocalStream(stream); setAudioEnabled(true); setVideoEnabled(true); }
    incomingCall.call.answer(stream || undefined);
    setCurrentCall(incomingCall.call);
    incomingCall.call.on('stream', (rs: MediaStream) => setRemoteStream(rs));
    incomingCall.call.on('close', () => { setCurrentCall(null); stopLocalStream(); });
    setIncomingCall(null);
  };

  const declineCall = () => { stopRingtone(); if (incomingCall) { incomingCall.call.close(); setIncomingCall(null); } };
  const hangUp = () => { stopRingtone(); if (currentCall) { currentCall.close(); setCurrentCall(null); } stopLocalStream(); };
  const stopLocalStream = () => { if (localStream) { localStream.getTracks().forEach(t => t.stop()); setLocalStream(null); } if (screenStream) { screenStream.getTracks().forEach(t => t.stop()); setScreenStream(null); } setRemoteStream(null); };
  const onShareScreen = async () => { /* реализация по желанию */ };

  const addContact = (userId: number) => { axios.post(`${API_URL}/api/contacts`, { contactId: userId }, { headers: { Authorization: `Bearer ${token}` } }).then(() => { const u = users.find(u => u.id === userId); if (u) setContacts(prev => [...prev, u]); }).catch(console.error); };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = () => sendMessage({ image: reader.result as string }); reader.readAsDataURL(f); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const startRecording = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); const chunks: Blob[] = []; recorder.ondataavailable = e => chunks.push(e.data); recorder.onstop = () => { const blob = new Blob(chunks, { type: 'audio/webm' }); const reader = new FileReader(); reader.onload = () => sendMessage({ audio: reader.result as string }); reader.readAsDataURL(blob); stream.getTracks().forEach(t => t.stop()); }; recorder.start(); setMediaRecorder(recorder); setRecording(true); } catch { alert('Нет микрофона'); } };
  const stopRecording = () => { mediaRecorder?.stop(); setRecording(false); };

  const stickers = ['😊', '😂', '😍', '👍', '🎉', '🔥', '❤️', '💯'];
  const sendSticker = (sticker: string) => {
    if (sticker.startsWith('data:image') || sticker.startsWith('http')) {
      sendMessage({ image: sticker });
    } else {
      setInput(sticker);
      sendMessage();
    }
    setShowStickers(false);
    setShowStickerManager(false);
    setShowStickerPack(false);
  };

  const handleSearchMessages = async () => {
    if (!isPremium) {
      alert('Поиск по сообщениям доступен только Premium-пользователям.');
      return;
    }
    const query = prompt('Введите текст для поиска:');
    if (!query) return;
    try {
      const res = await axios.get(`${API_URL}/api/messages/search?query=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.length === 0) {
        alert('Ничего не найдено.');
      } else {
        const formatted = res.data.map((m: any) => `[${new Date(m.created_at).toLocaleString()}] ${m.sender_name}: ${m.text}`).join('\n');
        alert(`Найдено сообщений: ${res.data.length}\n\n${formatted}`);
      }
    } catch (err) { console.error(err); alert('Ошибка поиска'); }
  };

  const cycleTtl = () => {
    const options = [0, 60, 300, 3600];
    const currentIndex = options.indexOf(ttl);
    const next = options[(currentIndex + 1) % options.length];
    setTtl(next);
  };

  const displayedContacts = [...contacts].sort((a, b) => {
    const unreadA = unreadCounts[a.id] || 0;
    const unreadB = unreadCounts[b.id] || 0;
    if (unreadA > 0 && unreadB === 0) return -1;
    if (unreadB > 0 && unreadA === 0) return 1;
    const timeA = lastMessageTimes[a.id] || '';
    const timeB = lastMessageTimes[b.id] || '';
    if (timeA && timeB) return timeB.localeCompare(timeA);
    if (timeA && !timeB) return -1;
    if (!timeA && timeB) return 1;
    return a.username.localeCompare(b.username);
  });

  const messageMaxWidth = deviceType === 'phone' ? '90%' : '85%';
  const messageFontSize = deviceType === 'phone' ? '14px' : '15px';
  const inputFontSize = deviceType === 'phone' ? '16px' : '15px';
  const sendButtonPadding = deviceType === 'phone' ? '14px 20px' : '12px 24px';
  const sidebarStyle = deviceType === 'phone' ? styles.sidebarPhone : styles.sidebar;

  return (
    <div style={styles.container}>
      {showDevicePrompt && <DevicePrompt onSelect={handleDeviceSelect} />}

      <UpdateBanner />
      {incomingCall && !currentCall && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{
            background: 'var(--sidebar-bg)', padding: 30, borderRadius: 24,
            textAlign: 'center',
          }}>
            <h3>📞 Входящий звонок</h3>
            <p>{incomingCall.from}</p>
            <button onClick={acceptCall} style={{ marginRight: 16, padding: '10px 24px', borderRadius: 40, background: '#4caf50', color: 'white', border: 'none' }}>Принять</button>
            <button onClick={declineCall} style={{ padding: '10px 24px', borderRadius: 40, background: '#f44336', color: 'white', border: 'none' }}>Отклонить</button>
          </motion.div>
        </motion.div>
      )}
      {currentCall && (
        <CallWindow
          localStream={localStream} remoteStream={remoteStream} onHangUp={hangUp}
          onToggleAudio={() => { if (localStream) { localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled); setAudioEnabled(prev => !prev); } }}
          onToggleVideo={() => { if (localStream) { localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled); setVideoEnabled(prev => !prev); } }}
          onShareScreen={onShareScreen} audioEnabled={audioEnabled} videoEnabled={videoEnabled} screenStream={screenStream}
          localAvatar={currentUser.avatar || localStorage.getItem('avatar')}
          remoteAvatar={selectedUser?.avatar || null}
        />
      )}

      {/* Боковая панель */}
      {(showSidebar || deviceType !== 'phone') && (
        <motion.div
          initial={deviceType === 'phone' ? { x: -300 } : false}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={sidebarStyle}
        >
          <div style={styles.sidebarHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={styles.sidebarTitle}>💬 CBEF</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {isAdmin && <button onClick={() => setShowAdmin(true)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }} title="Админ-панель">🛡️</button>}
                <button onClick={() => setShowAddFriend(true)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>👤+</button>
                <button onClick={() => setShowGroupCreator(true)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>👥</button>
                <button onClick={() => setShowChannelSearch(true)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>🔍</button>
                <button onClick={() => setShowChannelCreator(true)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>📢</button>
                <button onClick={openDevicePrompt} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} title="Сменить устройство">🔄</button>
              </div>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{currentUser.username} {isPremium && '💎'}</span>
              <button onClick={() => window.location.hash = '#/settings'} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)' }}>⚙️</button>
            </p>
          </div>
          <FriendRequests token={token!} onAccept={() => setRefreshContacts(prev => prev + 1)} />
          <div style={styles.contactList}>
            {displayedContacts.map(user => (
              <div key={user.id} style={{ ...styles.contactItem, backgroundColor: selectedUser?.id === user.id ? 'var(--hover-bg)' : 'transparent' }} onClick={() => { setSelectedUser(user); setSelectedGroup(null); setSelectedChannel(null); }}>
                <div style={styles.contactInfo}>
                  <span style={onlineUsers.has(user.id) ? styles.onlineDot : styles.offlineDot} />
                  <Avatar src={user.avatar} name={user.username} size={40} />
                  <span style={styles.contactName}>{user.username} {user.premium && '💎'}</span>
                  {unreadCounts[user.id] > 0 && <div style={styles.badge}>{unreadCounts[user.id]}</div>}
                </div>
              </div>
            ))}
            {groups.map(group => (
              <div key={group.id} style={{ ...styles.contactItem, backgroundColor: selectedGroup?.id === group.id ? 'var(--hover-bg)' : 'transparent' }} onClick={() => { setSelectedGroup(group); setSelectedUser(null); setSelectedChannel(null); }}>
                <div style={styles.contactInfo}><span style={{ fontSize: 20 }}>👥</span><span style={styles.contactName}>{group.name}</span></div>
              </div>
            ))}
            {channels.map(channel => (
              <div key={channel.id} style={{ ...styles.contactItem, backgroundColor: selectedChannel?.id === channel.id ? 'var(--hover-bg)' : 'transparent' }} onClick={() => { setSelectedChannel(channel); setSelectedUser(null); setSelectedGroup(null); }}>
                <div style={styles.contactInfo}><span style={{ fontSize: 20 }}>📢</span><span style={styles.contactName}>{channel.name}</span></div>
              </div>
            ))}
            <div style={{ ...styles.contactItem, justifyContent: 'center', color: 'var(--text-secondary)' }} onClick={() => alert('Создание ботов скоро появится!')}>
              <span>🤖 Создать бота</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Чат */}
      <div style={styles.chatArea}>
        {selectedUser || selectedGroup || selectedChannel ? (
          <>
            <div style={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button style={styles.backButton} onClick={handleBackToContacts}>←</button>
                <h3 style={styles.chatHeaderTitle}>
                  {selectedUser ? selectedUser.username : selectedGroup?.name || selectedChannel?.name}
                  {selectedUser && <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 400 }}>{onlineUsers.has(selectedUser.id) ? '🟢 онлайн' : '⚫ офлайн'}</span>}
                  {selectedUser && selectedUser.premium && <span style={{ marginLeft: 4 }}>💎</span>}
                  {selectedChannel && <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>{channelSubscribersCount} подписчиков</span>}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selectedUser && (
                  <button onClick={() => { setProfileUserId(selectedUser.id); setShowProfile(true); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }} title="Профиль">👤</button>
                )}
                {selectedChannel && (
                  <button onClick={copyChannelInviteLink} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }} title="Пригласить">📎</button>
                )}
                {!currentCall ? <button style={styles.callButton} onClick={startCall}>📞 Видеозвонок</button> : <button style={styles.hangUpButton} onClick={hangUp}>❌ Завершить</button>}
              </div>
            </div>
            <div style={styles.messagesContainer}>
              <AnimatePresence>
                {(selectedUser ? messages : selectedGroup ? groupMessages : channelMessages).map(msg => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ ...styles.messageRow, justifyContent: msg.sender_id === currentUser.id ? 'flex-end' : 'flex-start' }}>
                    {msg.sender_id !== currentUser.id && <Avatar src={selectedUser?.avatar} name={selectedUser?.username} size={32} />}
                    <div style={{
                      ...styles.messageBubble,
                      ...(msg.sender_id === currentUser.id ? styles.messageOwn : styles.messageOther),
                      maxWidth: messageMaxWidth,
                      fontSize: messageFontSize,
                    }}>
                      {msg.image ? (
                        (msg.image.startsWith('data:image') || msg.image.startsWith('http')) ? (
                          <img src={msg.image} alt="sent" style={{ maxWidth: '128px', maxHeight: '128px', borderRadius: 12, marginBottom: 4, cursor: 'pointer' }} onClick={() => setSelectedImage(msg.image)} />
                        ) : (
                          <span>{msg.image}</span>
                        )
                      ) : null}
                      {msg.audio && <audio controls src={msg.audio} style={{ maxWidth: 200 }} />}
                      {msg.text}
                      {msg.status && (
                        <span style={{ fontSize: 12, marginLeft: 8, opacity: 0.7 }}>
                          {msg.status === 'sent' && '✓'}
                          {msg.status === 'delivered' && '✓✓'}
                          {msg.status === 'read' && <span style={{ color: '#4a9eff' }}>✓✓</span>}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
            <div style={styles.inputContainer}>
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
              <button style={styles.iconButton} onClick={() => setShowAttachment(!showAttachment)}>📎</button>
              {showAttachment && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={styles.attachmentMenu}>
                  <button style={styles.iconButton} onClick={() => fileInputRef.current?.click()}>🖼️</button>
                  <button style={styles.iconButton} onClick={() => setShowStickerPack(true)}>📦</button>
                  <button style={styles.iconButton} onClick={() => setShowStickers(!showStickers)}>😀</button>
                  <button style={styles.iconButton} onClick={() => setShowStickerManager(true)}>🖼️+</button>
                  {recording ? <button style={styles.iconButton} onClick={stopRecording}>⏹️</button> : <button style={styles.iconButton} onClick={startRecording}>🎤</button>}
                </motion.div>
              )}
              <button style={styles.iconButton} onClick={() => setShowEmoji(!showEmoji)}>😊</button>
              <button style={styles.ttlButton} onClick={cycleTtl} title="Таймер самоудаления">
                {ttl === 0 ? '⏱️' : ttl === 60 ? '1м' : ttl === 300 ? '5м' : '1ч'}
              </button>
              <input style={{ ...styles.input, fontSize: inputFontSize }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Сообщение" />
              <button style={{ ...styles.sendButton, padding: sendButtonPadding }} onClick={() => sendMessage()}>Отправить</button>
            </div>
            {showEmoji && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'absolute', bottom: 90, right: 20, zIndex: 30 }}><EmojiPicker onEmojiClick={(e) => setInput(prev => prev + e.emoji)} /></motion.div>}
            {showStickers && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...styles.attachmentMenu, bottom: 130 }}>
                <div style={styles.stickerGrid}>
                  {stickers.map(s => <div key={s} style={styles.sticker} onClick={() => sendSticker(s)}>{s}</div>)}
                </div>
              </motion.div>
            )}
            {showStickerManager && <StickerManager onSendSticker={(url) => { sendSticker(url); }} onClose={() => setShowStickerManager(false)} />}
            {showStickerPack && <StickerPackViewer onSelectSticker={(url) => { sendSticker(url); }} onClose={() => setShowStickerPack(false)} />}
          </>
        ) : (
          <div style={styles.emptyChat}>Выберите контакт, группу или канал</div>
        )}
      </div>
      <audio ref={remoteAudioRef} autoPlay />

      {selectedImage && <ImageLightbox src={selectedImage} onClose={() => setSelectedImage(null)} />}
      {showProfile && profileUserId && <ProfileModal userId={profileUserId} token={token!} onClose={() => setShowProfile(false)} />}

      {showAddFriend && <AddFriend token={token!} onClose={() => setShowAddFriend(false)} />}
      {showGroupCreator && <GroupCreator token={token!} onClose={() => setShowGroupCreator(false)} onCreated={() => setRefreshContacts(prev => prev + 1)} />}
      {showChannelCreator && <ChannelCreator token={token!} onClose={() => setShowChannelCreator(false)} onCreated={() => setRefreshContacts(prev => prev + 1)} />}
      {showChannelSearch && <ChannelSearch token={token!} onClose={() => setShowChannelSearch(false)} onSubscribed={() => setRefreshContacts(prev => prev + 1)} />}
      {showAdmin && <AdminPanel token={token!} onClose={() => setShowAdmin(false)} />}
    </div>
  );
}