import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { Peer } from 'peerjs';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import ImageLightbox from './ImageLightbox';
import ChannelSearch from './ChannelSearch';
import ProfileModal from './ProfileModal';
import { ringtone } from '../utils/ringtone';

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const PEER_HOST = import.meta.env.VITE_PEER_HOST;
const PEER_PORT = import.meta.env.VITE_PEER_PORT;
const PEER_PATH = import.meta.env.VITE_PEER_PATH;

interface User {
  id: number;
  username: string;
  avatar?: string;
  is_admin?: boolean;
  banned?: boolean;
  bio?: string;
  premium?: boolean;
  is_premium?: boolean;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  group_id?: number;
  channel_id?: number;
  text: string;
  image?: string;
  audio?: string;
  status?: string;
  created_at: string;
  expires_at?: string;
}

export default function Chat() {
  const navigate = useNavigate();
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
  const [ttl, setTtl] = useState<number>(0);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

  // Calls
  const [peer, setPeer] = useState<Peer | null>(null);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ call: any; from: string } | null>(null);
  const [isVideoCall, setIsVideoCall] = useState<boolean>(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Audio elements
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modals & UI states
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showStickerManager, setShowStickerManager] = useState(false);
  const [showStickerPack, setShowStickerPack] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showChannelSearch, setShowChannelSearch] = useState(false);
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [showChannelCreator, setShowChannelCreator] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  // Recording
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Device & responsive auto-detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined'
      ? window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)
      : false;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups' | 'channels'>('all');
  const [refreshContacts, setRefreshContacts] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [lastMessageTimes, setLastMessageTimes] = useState<Record<number, string>>({});
  const [channelSubscribersCount, setChannelSubscribersCount] = useState<number>(0);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const isAdmin = currentUser.is_admin === true || currentUser.isAdmin === true;
  const isPremium = currentUser.is_premium === true || currentUser.premium === true;

  // Dynamic window resize listener for seamless responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, groupMessages, channelMessages]);

  // Reset messages when switching chat
  useEffect(() => {
    setMessages([]);
    setGroupMessages([]);
    setChannelMessages([]);
  }, [selectedUser?.id, selectedGroup?.id, selectedChannel?.id]);

  const handleBackToList = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
    setSelectedChannel(null);
  };

  // Fetch initial data
  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setUsers(r.data || [])).catch(console.error);
    axios.get(`${API_URL}/api/contacts`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setContacts(r.data || [])).catch(console.error);
    axios.get(`${API_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setGroups(r.data || [])).catch(console.error);
    axios.get(`${API_URL}/api/channels`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setChannels(r.data || [])).catch(console.error);
  }, [token, refreshContacts]);

  // Socket.IO
  useEffect(() => {
    if (!token) return;
    const newSocket = io(SOCKET_URL, { auth: { token }, transports: ['polling', 'websocket'] });
    setSocket(newSocket);

    newSocket.on('connect', () => console.log('Socket connected'));

    newSocket.on('private_message', (msg: Message) => {
      if (selectedUser && (msg.sender_id === selectedUser.id || msg.sender_id === currentUser.id)) {
        setMessages(prev => [...prev, msg]);
      } else if (msg.sender_id !== currentUser.id) {
        setUnreadCounts(prev => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }));
        setLastMessageTimes(prev => ({ ...prev, [msg.sender_id]: msg.created_at }));
      }
    });

    newSocket.on('group_message', (msg: Message) => {
      if (selectedGroup && msg.group_id === selectedGroup.id) {
        setGroupMessages(prev => [...prev, msg]);
      }
    });

    newSocket.on('channel_message', (msg: Message) => {
      if (selectedChannel && msg.channel_id === selectedChannel.id) {
        setChannelMessages(prev => [...prev, msg]);
      }
    });

    newSocket.on('user_status', ({ userId, online }: { userId: number; online: boolean }) => {
      setOnlineUsers(prev => {
        const n = new Set(prev);
        online ? n.add(userId) : n.delete(userId);
        return n;
      });
    });

    newSocket.on('friend_request', ({ fromName }: { fromName: string }) => {
      alert(`Новая заявка в друзья от ${fromName}`);
      setRefreshContacts(p => p + 1);
    });

    newSocket.on('friend_request_accepted', ({ byName }: { byName: string }) => {
      alert(`${byName} принял заявку в друзья`);
      setRefreshContacts(p => p + 1);
    });

    newSocket.on('message_status', ({ receiverId, status }: { receiverId: number; status: string }) => {
      setMessages(prev =>
        prev.map(msg => {
          if (msg.receiver_id === receiverId && msg.sender_id === currentUser.id && msg.status !== 'read') {
            return { ...msg, status };
          }
          return msg;
        })
      );
    });

    newSocket.on('banned', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
      alert('Ваш аккаунт заблокирован администратором.');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, currentUser.id, selectedUser, selectedGroup, selectedChannel, navigate]);

  // PeerJS calls setup
  useEffect(() => {
    if (!currentUser.id) return;
    const newPeer = new Peer(currentUser.id.toString(), {
      host: PEER_HOST,
      port: parseInt(PEER_PORT),
      path: PEER_PATH,
      secure: true,
    });
    setPeer(newPeer);

    newPeer.on('call', call => {
      setIncomingCall({ call, from: call.peer });
      ringtone.startIncomingRingtone();
    });

    return () => {
      ringtone.stop();
      newPeer.destroy();
    };
  }, [currentUser.id]);

  // Load chat messages
  useEffect(() => {
    if (!selectedUser || !token) return;
    axios
      .get(`${API_URL}/api/messages/${selectedUser.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const fixed = (r.data || []).map((m: Message) => {
          if (m.image && !m.image.startsWith('data:image') && !m.image.startsWith('http')) {
            return { ...m, text: m.image, image: undefined };
          }
          return m;
        });
        setMessages(fixed);
        setUnreadCounts(prev => ({ ...prev, [selectedUser.id]: 0 }));
        axios.put(`${API_URL}/api/messages/${selectedUser.id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(console.error);
      })
      .catch(console.error);
  }, [selectedUser, token]);

  useEffect(() => {
    if (!selectedGroup || !token) return;
    axios
      .get(`${API_URL}/api/groups/${selectedGroup.id}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setGroupMessages(r.data || []))
      .catch(console.error);
  }, [selectedGroup, token]);

  useEffect(() => {
    if (!selectedChannel || !token) return;
    axios
      .get(`${API_URL}/api/channels/${selectedChannel.id}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setChannelMessages(r.data || []))
      .catch(console.error);

    axios
      .get(`${API_URL}/api/channels/${selectedChannel.id}/subscribers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setChannelSubscribersCount(r.data.count || 0))
      .catch(console.error);
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

  // Calling functions
  const startCall = async (video: boolean) => {
    if (!peer || !selectedUser) return;
    setIsVideoCall(video);
    ringtone.startOutgoingRingback();

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: video });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setIsVideoCall(false);
      } catch {
        ringtone.stop();
        alert('Не удалось получить доступ к микрофону/камере.');
        return;
      }
    }

    if (stream) {
      setLocalStream(stream);
      setAudioEnabled(true);
      setVideoEnabled(video);
    }

    const call = peer.call(selectedUser.id.toString(), stream || undefined);
    if (call) {
      setCurrentCall(call);
      call.on('stream', (rs: MediaStream) => {
        ringtone.stop();
        setRemoteStream(rs);
      });
      call.on('close', () => {
        ringtone.stop();
        setCurrentCall(null);
        stopLocalStream();
      });
    }
  };

  const acceptCall = async () => {
    ringtone.stop();
    if (!incomingCall) return;

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setIsVideoCall(true);
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsVideoCall(false);
      } catch {
        alert('Не удалось получить доступ к микрофону.');
      }
    }

    if (stream) {
      setLocalStream(stream);
      setAudioEnabled(true);
      setVideoEnabled(true);
    }

    incomingCall.call.answer(stream || undefined);
    setCurrentCall(incomingCall.call);

    incomingCall.call.on('stream', (rs: MediaStream) => {
      setRemoteStream(rs);
    });

    incomingCall.call.on('close', () => {
      setCurrentCall(null);
      stopLocalStream();
    });

    setIncomingCall(null);
  };

  const declineCall = () => {
    ringtone.stop();
    if (incomingCall) {
      incomingCall.call.close();
      setIncomingCall(null);
    }
  };

  const hangUp = () => {
    ringtone.stop();
    if (currentCall) {
      currentCall.close();
      setCurrentCall(null);
    }
    stopLocalStream();
  };

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    }
    setRemoteStream(null);
  };

  const onShareScreen = async () => {
    try {
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        stream.getVideoTracks()[0].onended = () => setScreenStream(null);
      }
    } catch (err) {
      console.warn('Screen share canceled or failed', err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => sendMessage({ image: reader.result as string });
    reader.readAsDataURL(f);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowAttachment(false);
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
    } catch {
      alert('Нет доступа к микрофону');
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
    setShowAttachment(false);
  };

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

  const copyChannelInviteLink = () => {
    if (!selectedChannel) return;
    const link = `${window.location.origin}/#/channel/${selectedChannel.id}`;
    navigator.clipboard.writeText(link).then(() => alert('Ссылка скопирована!')).catch(() => prompt('Скопируйте ссылку вручную:', link));
  };

  const cycleTtl = () => {
    const options = [0, 60, 300, 3600];
    const currentIndex = options.indexOf(ttl);
    setTtl(options[(currentIndex + 1) % options.length]);
  };

  // Filter contacts by tab and search
  const filteredContacts = contacts
    .filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const unreadA = unreadCounts[a.id] || 0;
      const unreadB = unreadCounts[b.id] || 0;
      if (unreadA > 0 && unreadB === 0) return -1;
      if (unreadB > 0 && unreadA === 0) return 1;
      return a.username.localeCompare(b.username);
    });

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const hasChatSelected = !!(selectedUser || selectedGroup || selectedChannel);

  // Incoming caller lookup
  const incomingCaller = incomingCall ? users.find(u => u.id.toString() === incomingCall.from) : null;

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-primary)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <UpdateBanner />

      {/* Модальное окно входящего звонка с музыкой и аватаром */}
      {incomingCall && !currentCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6000,
          }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            style={{
              backgroundColor: 'var(--sidebar-bg)',
              border: '1px solid var(--border-color)',
              padding: '36px 32px',
              borderRadius: '28px',
              textAlign: 'center',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              maxWidth: '380px',
              width: '90%',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              style={{ display: 'inline-block', marginBottom: 16 }}
            >
              <Avatar src={incomingCaller?.avatar} name={incomingCaller?.username || `ID ${incomingCall.from}`} size={84} />
            </motion.div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Входящий звонок</h3>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: '0 0 24px' }}>
              {incomingCaller?.username || `Пользователь #${incomingCall.from}`}
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={acceptCall}
                style={{
                  padding: '12px 28px',
                  borderRadius: '30px',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                }}
              >
                📞 Ответить
              </button>
              <button
                onClick={declineCall}
                style={{
                  padding: '12px 24px',
                  borderRadius: '30px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                }}
              >
                Отклонить
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Окно активного звонка */}
      {currentCall && (
        <CallWindow
          localStream={localStream}
          remoteStream={remoteStream}
          onHangUp={hangUp}
          onToggleAudio={() => {
            if (localStream) {
              localStream.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
              setAudioEnabled(prev => !prev);
            }
          }}
          onToggleVideo={() => {
            if (localStream) {
              localStream.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
              setVideoEnabled(prev => !prev);
            }
          }}
          onShareScreen={onShareScreen}
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          screenStream={screenStream}
          localAvatar={currentUser.avatar || localStorage.getItem('avatar')}
          remoteAvatar={selectedUser?.avatar || undefined}
          remoteName={selectedUser?.username || 'Собеседник'}
          isVideoCall={isVideoCall}
        />
      )}

      {/* ЛЕВАЯ КОЛОНКА (СПИСОК ЧАТОВ) */}
      <div
        style={{
          width: isMobile ? '100%' : '350px',
          minWidth: isMobile ? '100%' : '320px',
          maxWidth: isMobile ? '100%' : '400px',
          height: '100vh',
          display: isMobile && hasChatSelected ? 'none' : 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-color)',
          zIndex: 10,
        }}
      >
        {/* Шапка сайдбара */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--header-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                onClick={() => navigate('/settings')}
                style={{ cursor: 'pointer' }}
                title="Перейти в настройки"
              >
                <Avatar src={currentUser.avatar || localStorage.getItem('avatar')} name={currentUser.username} size={38} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {currentUser.username} {isPremium && '⭐'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>CBEF Messenger</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {isAdmin && (
                <button
                  onClick={() => setShowAdmin(true)}
                  style={topIconBtn}
                  title="Панель администратора"
                >
                  🛡️
                </button>
              )}
              <button onClick={() => setShowAddFriend(true)} style={topIconBtn} title="Добавить друга">
                👤+
              </button>
              <button onClick={() => setShowGroupCreator(true)} style={topIconBtn} title="Создать группу">
                👥
              </button>
              <button onClick={() => setShowChannelCreator(true)} style={topIconBtn} title="Создать канал">
                📢
              </button>
              <button onClick={() => navigate('/settings')} style={topIconBtn} title="Настройки">
                ⚙️
              </button>
            </div>
          </div>

          {/* Строка поиска */}
          <div style={{ position: 'relative' }}>
            <input
              style={{
                width: '100%',
                padding: '9px 14px 9px 34px',
                borderRadius: '18px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
              placeholder="Поиск чатов и каналов..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <span style={{ position: 'absolute', left: 12, top: 9, color: 'var(--text-secondary)', fontSize: 14 }}>🔍</span>
          </div>

          {/* Вкладки: Все / Личные / Группы / Каналы */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {[
              { id: 'all', label: 'Все' },
              { id: 'direct', label: 'Личные' },
              { id: 'groups', label: 'Группы' },
              { id: 'channels', label: 'Каналы' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.id ? 'var(--button-bg)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--button-text)' : 'var(--text-secondary)',
                  transition: 'background-color 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Заявки в друзья */}
        <FriendRequests token={token!} onAccept={() => setRefreshContacts(prev => prev + 1)} />

        {/* Список диалогов */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Личные чаты */}
          {(activeTab === 'all' || activeTab === 'direct') &&
            filteredContacts.map(user => {
              const isSelected = selectedUser?.id === user.id;
              const isOnline = onlineUsers.has(user.id);
              return (
                <div
                  key={`user-${user.id}`}
                  onClick={() => {
                    setSelectedUser(user);
                    setSelectedGroup(null);
                    setSelectedChannel(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--active-chat-bg)' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar src={user.avatar} name={user.username} size={44} />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: isOnline ? '#22c55e' : '#94a3b8',
                          border: '2px solid var(--sidebar-bg)',
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {user.username} {user.premium && '⭐'}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {isOnline ? 'в сети' : 'был(а) недавно'}
                      </div>
                    </div>
                  </div>
                  {unreadCounts[user.id] > 0 && (
                    <div
                      style={{
                        backgroundColor: '#0084ff',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {unreadCounts[user.id]}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Группы */}
          {(activeTab === 'all' || activeTab === 'groups') &&
            filteredGroups.map(group => {
              const isSelected = selectedGroup?.id === group.id;
              return (
                <div
                  key={`group-${group.id}`}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedUser(null);
                    setSelectedChannel(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 18px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--active-chat-bg)' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 132, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                    }}
                  >
                    👥
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{group.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Групповой чат</div>
                  </div>
                </div>
              );
            })}

          {/* Каналы */}
          {(activeTab === 'all' || activeTab === 'channels') &&
            filteredChannels.map(channel => {
              const isSelected = selectedChannel?.id === channel.id;
              return (
                <div
                  key={`channel-${channel.id}`}
                  onClick={() => {
                    setSelectedChannel(channel);
                    setSelectedUser(null);
                    setSelectedGroup(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 18px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--active-chat-bg)' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(234, 88, 12, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                    }}
                  >
                    📢
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{channel.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Канал</div>
                  </div>
                </div>
              );
            })}

          {filteredContacts.length === 0 && filteredGroups.length === 0 && filteredChannels.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
              Чатов пока нет. Нажмите 👤+ чтобы добавить друзей или 📢 чтобы подписаться на канал!
            </div>
          )}
        </div>
      </div>

      {/* ПРАВАЯ ОБЛАСТЬ (АКТИВНЫЙ ЧАТ) */}
      <div
        style={{
          flex: 1,
          height: '100vh',
          display: isMobile && !hasChatSelected ? 'none' : 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--chat-bg)',
          backgroundImage: 'var(--chat-pattern)',
          backgroundSize: '24px 24px',
          position: 'relative',
        }}
      >
        {hasChatSelected ? (
          <>
            {/* Шапка чата */}
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: 'var(--header-bg)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isMobile && (
                  <button
                    onClick={handleBackToList}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 22,
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      padding: '4px 8px 4px 0',
                    }}
                  >
                    ←
                  </button>
                )}

                {selectedUser && <Avatar src={selectedUser.avatar} name={selectedUser.username} size={42} />}
                {selectedGroup && (
                  <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: 'rgba(0,132,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    👥
                  </div>
                )}
                {selectedChannel && (
                  <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: 'rgba(234,88,12,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    📢
                  </div>
                )}

                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {selectedUser ? selectedUser.username : selectedGroup ? selectedGroup.name : selectedChannel?.name}
                    {selectedUser?.premium && ' ⭐'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {selectedUser && (onlineUsers.has(selectedUser.id) ? '🟢 в сети' : '⚫ не в сети')}
                    {selectedGroup && 'групповой чат'}
                    {selectedChannel && `${channelSubscribersCount} подписчиков`}
                  </div>
                </div>
              </div>

              {/* Кнопки звонков и действий в шапке */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {/* ЗВОНКИ ТОЛЬКО В ЛИЧНЫХ ЧАТАХ (в каналах и группах звонки отключены) */}
                {selectedUser && !currentCall && (
                  <>
                    <button
                      onClick={() => startCall(false)}
                      title="Аудиозвонок"
                      style={callBtnStyle}
                    >
                      📞
                    </button>
                    <button
                      onClick={() => startCall(true)}
                      title="Видеозвонок"
                      style={callBtnStyle}
                    >
                      📹
                    </button>
                  </>
                )}

                {selectedUser && (
                  <button
                    onClick={() => {
                      setProfileUserId(selectedUser.id);
                      setShowProfile(true);
                    }}
                    title="Профиль"
                    style={topIconBtn}
                  >
                    ℹ️
                  </button>
                )}

                {selectedChannel && (
                  <button onClick={copyChannelInviteLink} title="Скопировать ссылку-приглашение" style={topIconBtn}>
                    🔗
                  </button>
                )}
              </div>
            </div>

            {/* Сообщения */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AnimatePresence>
                {(selectedUser ? messages : selectedGroup ? groupMessages : channelMessages).map(msg => {
                  const isOwn = msg.sender_id === currentUser.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        gap: 8,
                        alignItems: 'flex-end',
                      }}
                    >
                      {!isOwn && selectedUser && <Avatar src={selectedUser.avatar} name={selectedUser.username} size={30} />}
                      <div
                        style={{
                          maxWidth: isMobile ? '82%' : '65%',
                          padding: '10px 16px',
                          borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: isOwn ? 'var(--message-own-bg)' : 'var(--message-other-bg)',
                          color: isOwn ? 'var(--message-own-text)' : 'var(--message-other-text)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                          wordBreak: 'break-word',
                          fontSize: 15,
                          lineHeight: 1.45,
                        }}
                      >
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="attached"
                            onClick={() => setSelectedImage(msg.image!)}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '260px',
                              borderRadius: '12px',
                              marginBottom: 6,
                              cursor: 'pointer',
                              display: 'block',
                            }}
                          />
                        )}
                        {msg.audio && <audio controls src={msg.audio} style={{ width: '220px', marginBottom: 4 }} />}
                        <div>{msg.text}</div>
                        <div
                          style={{
                            fontSize: 11,
                            marginTop: 4,
                            textAlign: 'right',
                            opacity: 0.7,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 4,
                          }}
                        >
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          {isOwn && (
                            <span>
                              {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Ввод сообщения */}
            <div
              style={{
                padding: '12px 18px',
                backgroundColor: 'var(--header-bg)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                position: 'relative',
              }}
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <button
                onClick={() => setShowAttachment(!showAttachment)}
                style={iconActionBtn}
                title="Прикрепить"
              >
                📎
              </button>

              {showAttachment && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    bottom: 60,
                    left: 20,
                    backgroundColor: 'var(--sidebar-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 18,
                    padding: 8,
                    display: 'flex',
                    gap: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    zIndex: 20,
                  }}
                >
                  <button style={iconActionBtn} onClick={() => fileInputRef.current?.click()} title="Фотография">
                    🖼️
                  </button>
                  <button style={iconActionBtn} onClick={() => setShowStickerPack(true)} title="Стикеры">
                    📦
                  </button>
                  <button style={iconActionBtn} onClick={() => setShowStickers(!showStickers)} title="Эмодзи">
                    😀
                  </button>
                  {recording ? (
                    <button style={{ ...iconActionBtn, backgroundColor: '#ef4444', color: 'white' }} onClick={stopRecording}>
                      ⏹️
                    </button>
                  ) : (
                    <button style={iconActionBtn} onClick={startRecording} title="Голосовое сообщение">
                      🎤
                    </button>
                  )}
                </motion.div>
              )}

              <button onClick={() => setShowEmoji(!showEmoji)} style={iconActionBtn} title="Смайлики">
                😊
              </button>

              <button onClick={cycleTtl} style={iconActionBtn} title="Самоудаление сообщения">
                {ttl === 0 ? '⏱️' : ttl === 60 ? '1м' : ttl === 300 ? '5м' : '1ч'}
              </button>

              <input
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '24px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: 15,
                  outline: 'none',
                }}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Напишите сообщение..."
              />

              <button
                onClick={() => sendMessage()}
                style={{
                  padding: '12px 22px',
                  borderRadius: '24px',
                  backgroundColor: '#0084ff',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 132, 255, 0.3)',
                }}
              >
                Отправить
              </button>
            </div>

            {/* Эмодзи пикер */}
            {showEmoji && (
              <div style={{ position: 'absolute', bottom: 70, right: 20, zIndex: 40 }}>
                <EmojiPicker onEmojiClick={e => setInput(prev => prev + e.emoji)} />
              </div>
            )}

            {/* Стикеры сетка */}
            {showStickers && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 70,
                  left: 20,
                  backgroundColor: 'var(--sidebar-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 16,
                  padding: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  zIndex: 40,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {stickers.map(s => (
                    <div
                      key={s}
                      onClick={() => sendSticker(s)}
                      style={{ fontSize: 26, cursor: 'pointer', padding: 6, textAlign: 'center' }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showStickerPack && (
              <StickerPackViewer onSelectSticker={sendSticker} onClose={() => setShowStickerPack(false)} />
            )}
            {showStickerManager && (
              <StickerManager onSendSticker={sendSticker} onClose={() => setShowStickerManager(false)} />
            )}
          </>
        ) : (
          /* Пустой экран, когда ни один чат не выбран */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 132, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 44,
                marginBottom: 16,
              }}
            >
              💬
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
              Добро пожаловать в CBEF
            </h3>
            <p style={{ maxWidth: 360, fontSize: 15, margin: 0, lineHeight: 1.5 }}>
              Выберите диалог, группу или канал из списка слева, чтобы начать общение.
            </p>
          </div>
        )}
      </div>

      <audio ref={remoteAudioRef} autoPlay />

      {/* Модалки */}
      {selectedImage && <ImageLightbox src={selectedImage} onClose={() => setSelectedImage(null)} />}
      {showProfile && profileUserId && (
        <ProfileModal userId={profileUserId} token={token!} onClose={() => setShowProfile(false)} />
      )}
      {showAddFriend && <AddFriend token={token!} onClose={() => setShowAddFriend(false)} />}
      {showGroupCreator && (
        <GroupCreator token={token!} onClose={() => setShowGroupCreator(false)} onCreated={() => setRefreshContacts(p => p + 1)} />
      )}
      {showChannelCreator && (
        <ChannelCreator token={token!} onClose={() => setShowChannelCreator(false)} onCreated={() => setRefreshContacts(p => p + 1)} />
      )}
      {showChannelSearch && (
        <ChannelSearch token={token!} onClose={() => setShowChannelSearch(false)} onSubscribed={() => setRefreshContacts(p => p + 1)} />
      )}
      {showAdmin && <AdminPanel token={token!} onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

const topIconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  padding: 6,
  borderRadius: 8,
  color: 'var(--text-secondary)',
};

const iconActionBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 20,
  cursor: 'pointer',
  padding: 8,
  borderRadius: '50%',
  color: 'var(--text-secondary)',
};

const callBtnStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0, 132, 255, 0.12)',
  color: '#0084ff',
  border: 'none',
  borderRadius: '20px',
  padding: '8px 14px',
  fontSize: 18,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.15s',
};
