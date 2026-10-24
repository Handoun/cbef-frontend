import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Avatar from './Avatar';

interface CallWindowProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onHangUp: (durationSeconds?: number) => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenStream: MediaStream | null;
  localAvatar?: string;
  remoteAvatar?: string;
  remoteName?: string;
  isVideoCall?: boolean;
}

export default function CallWindow({
  localStream,
  remoteStream,
  onHangUp,
  onToggleAudio,
  onToggleVideo,
  onShareScreen,
  audioEnabled,
  videoEnabled,
  screenStream,
  localAvatar,
  remoteAvatar,
  remoteName = 'Собеседник',
  isVideoCall = true,
}: CallWindowProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [seconds, setSeconds] = useState(0);

  const hasRemoteVideo = Boolean(
    remoteStream && remoteStream.getVideoTracks().some(t => t.enabled && t.readyState === 'live')
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      const p = remoteAudioRef.current.play();
      if (p !== undefined) {
        p.catch(err => console.warn('remoteAudioRef autoPlay blocked:', err));
      }
    }
  }, [remoteStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      const p = remoteVideoRef.current.play();
      if (p !== undefined) {
        p.catch(err => console.warn('remoteVideoRef autoPlay blocked:', err));
      }
    }
  }, [remoteStream, isVideoCall, hasRemoteVideo]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0a0f1d',
        zIndex: 5000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px',
        color: 'white',
      }}
    >
      {/* Верхняя плашка с инфо о звонке */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
          padding: '10px 24px',
          borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600 }}>{remoteName}</div>
        <div style={{ fontSize: 14, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
          {isVideoCall ? 'Видеозвонок' : 'Аудиозвонок'} • {formatTime(seconds)}
        </div>
      </div>

      {/* Центральная область: видео или крупный пульсирующий аватар */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1000px',
          height: '65%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 24,
          overflow: 'hidden',
          background: 'radial-gradient(circle, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.95) 100%)',
        }}
      >
        {screenStream ? (
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : isVideoCall && hasRemoteVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
                boxShadow: [
                  '0 0 0 0 rgba(59, 130, 246, 0.4)',
                  '0 0 0 24px rgba(59, 130, 246, 0)',
                  '0 0 0 0 rgba(59, 130, 246, 0)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              style={{ borderRadius: '50%' }}
            >
              <Avatar src={remoteAvatar} name={remoteName} size={140} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{remoteName}</div>
              <div style={{ color: '#38bdf8', marginTop: 4, fontSize: 14 }}>
                {audioEnabled ? 'Соединение установлено' : 'Микрофон отключен'}
              </div>
            </div>
          </div>
        )}

        {/* Локальное превью камеры (Picture-in-Picture) */}
        {isVideoCall && (
          <motion.div
            drag
            dragConstraints={{ top: -200, left: -400, right: 0, bottom: 0 }}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              width: 160,
              height: 120,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
              border: '2px solid rgba(255,255,255,0.2)',
              backgroundColor: '#1e293b',
              cursor: 'grab',
            }}
          >
            {localStream && videoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#1e293b',
                }}
              >
                <Avatar src={localAvatar} name="Вы" size={50} />
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Нижняя панель управления */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          padding: '14px 24px',
          borderRadius: 40,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          onClick={onToggleAudio}
          title={audioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
          style={{
            ...actionBtnStyle,
            backgroundColor: audioEnabled ? 'rgba(255,255,255,0.15)' : '#ef4444',
          }}
        >
          {audioEnabled ? '🎤' : '🔇'}
        </button>

        <button
          onClick={onToggleVideo}
          title={videoEnabled ? 'Выключить камеру' : 'Включить камеру'}
          style={{
            ...actionBtnStyle,
            backgroundColor: videoEnabled ? 'rgba(255,255,255,0.15)' : '#ef4444',
          }}
        >
          {videoEnabled ? '📹' : '🚫'}
        </button>

        <button
          onClick={onShareScreen}
          title="Демонстрация экрана"
          style={{
            ...actionBtnStyle,
            backgroundColor: screenStream ? '#22c55e' : 'rgba(255,255,255,0.15)',
          }}
        >
          🖥️
        </button>

        <button
          onClick={() => onHangUp(seconds)}
          title="Завершить звонок"
          style={{
            ...actionBtnStyle,
            backgroundColor: '#ef4444',
            width: 64,
            height: 64,
            fontSize: 26,
          }}
        >
          📞
        </button>
      </div>
      {/* Всегда активный аудио элемент для чистого проигрывания звука собеседника */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0.01,
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: '50%',
  fontSize: 20,
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.15s, background-color 0.2s',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
};
