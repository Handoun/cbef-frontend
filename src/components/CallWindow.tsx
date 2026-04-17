import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface CallWindowProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onHangUp: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export default function CallWindow({
  localStream, remoteStream, onHangUp,
  onToggleAudio, onToggleVideo, audioEnabled, videoEnabled,
}: CallWindowProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

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
      <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
      <video ref={localVideoRef} autoPlay playsInline muted style={{ position: 'absolute', bottom: 20, right: 20, width: 150, borderRadius: 12 }} />
      <div style={{ position: 'absolute', bottom: 30, display: 'flex', gap: 20 }}>
        <button onClick={onToggleAudio} style={controlButtonStyle}>{audioEnabled ? '🎤' : '🔇'}</button>
        <button onClick={onToggleVideo} style={controlButtonStyle}>{videoEnabled ? '📹' : '🚫'}</button>
        <button onClick={onHangUp} style={{ ...controlButtonStyle, background: 'red' }}>📞</button>
      </div>
    </motion.div>
  );
}

const controlButtonStyle: React.CSSProperties = {
  width: 60, height: 60, borderRadius: '50%', fontSize: 24,
  background: '#333', color: 'white', border: 'none', cursor: 'pointer',
};