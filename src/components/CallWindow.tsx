import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Avatar from './Avatar';

interface CallWindowProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onHangUp: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenStream: MediaStream | null;
  localAvatar?: string;
  remoteAvatar?: string;
  remoteName?: string;
}

export default function CallWindow({
  localStream, remoteStream, onHangUp,
  onToggleAudio, onToggleVideo, onShareScreen,
  audioEnabled, videoEnabled, screenStream,
  localAvatar, remoteAvatar, remoteName = 'Собеседник',
}: CallWindowProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) screenVideoRef.current.srcObject = screenStream;
  }, [screenStream]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#1a1a1a', zIndex: 2000, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Основной экран: демонстрация или видео собеседника */}
      <div style={{ position: 'relative', width: '100%', height: '70%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {screenStream ? (
          <video ref={screenVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' }}>
            <Avatar src={remoteAvatar} name={remoteName} size={100} />
            <p>{remoteName}</p>
          </div>
        )}
      </div>

      {/* Своё видео (маленькое окно) */}
      <div style={{ position: 'absolute', bottom: 120, right: 20, width: 150, borderRadius: 12, overflow: 'hidden' }}>
        {localStream ? (
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: 'auto' }} />
        ) : (
          <div style={{ width: '100%', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <Avatar src={localAvatar} name="Вы" size={50} />
          </div>
        )}
      </div>

      {/* Панель управления */}
      <div style={{ position: 'absolute', bottom: 30, display: 'flex', gap: 20 }}>
        <button onClick={onToggleAudio} style={controlButtonStyle}>{audioEnabled ? '🎤' : '🔇'}</button>
        <button onClick={onToggleVideo} style={controlButtonStyle}>{videoEnabled ? '📹' : '🚫'}</button>
        <button onClick={onShareScreen} style={controlButtonStyle}>{screenStream ? '🖥️✅' : '🖥️'}</button>
        <button onClick={onHangUp} style={{ ...controlButtonStyle, background: 'red' }}>📞</button>
      </div>
    </motion.div>
  );
}

const controlButtonStyle: React.CSSProperties = {
  width: 60, height: 60, borderRadius: '50%', fontSize: 24,
  background: '#333', color: 'white', border: 'none', cursor: 'pointer',
};