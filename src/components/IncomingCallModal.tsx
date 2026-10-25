import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';

interface IncomingCallModalProps {
  callerName: string;
  callerAvatar?: string;
  isVideo?: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({
  callerName,
  callerAvatar,
  isVideo = false,
  onAccept,
  onDecline,
}: IncomingCallModalProps) {
  // Support keyboard shortcuts: Enter to accept, Escape to decline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDecline();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAccept, onDecline]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 10, 20, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}
      >
        {/* Размытый атмосферный задний фон в тон аватара */}
        {callerAvatar && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '450px',
              height: '450px',
              backgroundImage: `url(${callerAvatar})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(90px)',
              opacity: 0.22,
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        {/* Главная карточка входящего звонка */}
        <motion.div
          initial={{ scale: 0.88, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          style={{
            position: 'relative',
            zIndex: 1,
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.72) 0%, rgba(15, 23, 42, 0.88) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            borderRadius: '36px',
            padding: '44px 36px 36px',
            width: '100%',
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          {/* Верхний бейдж типа звонка */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: '24px',
              background: isVideo
                ? 'rgba(56, 189, 248, 0.12)'
                : 'rgba(34, 197, 94, 0.12)',
              border: `1px solid ${isVideo ? 'rgba(56, 189, 248, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              color: isVideo ? '#38bdf8' : '#4ade80',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.3px',
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isVideo ? '#38bdf8' : '#22c55e',
                boxShadow: isVideo ? '0 0 10px #38bdf8' : '0 0 10px #22c55e',
                animation: 'pulse 1.6s infinite',
              }}
            />
            {isVideo ? 'Входящий видеозвонок' : 'Входящий аудиозвонок'}
          </div>

          {/* Пульсирующий аватар с круговыми волнами */}
          <div
            style={{
              position: 'relative',
              width: 124,
              height: 124,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            {/* Волна 1 */}
            <motion.div
              animate={{
                scale: [1, 1.4, 1.75],
                opacity: [0.55, 0.22, 0],
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '50%',
                border: isVideo ? '2px solid rgba(56, 189, 248, 0.7)' : '2px solid rgba(34, 197, 94, 0.7)',
                pointerEvents: 'none',
              }}
            />

            {/* Волна 2 со сдвигом по времени */}
            <motion.div
              animate={{
                scale: [1, 1.4, 1.75],
                opacity: [0.55, 0.22, 0],
              }}
              transition={{ repeat: Infinity, duration: 2.2, delay: 0.7, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '50%',
                border: isVideo ? '2px solid rgba(99, 102, 241, 0.6)' : '2px solid rgba(59, 130, 246, 0.6)',
                pointerEvents: 'none',
              }}
            />

            {/* Сам аватар */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              style={{
                position: 'relative',
                zIndex: 2,
                borderRadius: '50%',
                boxShadow: '0 12px 35px rgba(0,0,0,0.5)',
              }}
            >
              <Avatar src={callerAvatar} name={callerName} size={110} />
            </motion.div>
          </div>

          {/* Имя звонящего */}
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: '0 0 6px',
              letterSpacing: '-0.3px',
              color: '#ffffff',
              wordBreak: 'break-word',
              maxWidth: '100%',
            }}
          >
            {callerName}
          </h2>

          <p
            style={{
              fontSize: 14,
              color: '#94a3b8',
              margin: '0 0 36px',
            }}
          >
            {isVideo ? 'Хочет начать видеозвонок' : 'Вызывает вас...'}
          </p>

          {/* Кнопки действий: Отклонить и Принять */}
          <div
            style={{
              display: 'flex',
              gap: 40,
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              marginBottom: 16,
            }}
          >
            {/* Кнопка отклонить */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                onClick={onDecline}
                title="Отклонить вызов (Esc)"
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 28px rgba(239, 68, 68, 0.45)',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* Иконка сброса трубки */}
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.99.99 0 0 1 0-1.41C3.28 8.8 7.42 7 12 7s8.72 1.8 11.71 4.67c.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                </svg>
              </motion.button>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f87171' }}>Отклонить</span>
            </div>

            {/* Кнопка принять */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                animate={{
                  boxShadow: [
                    '0 8px 24px rgba(34, 197, 94, 0.4)',
                    '0 8px 36px rgba(34, 197, 94, 0.75)',
                    '0 8px 24px rgba(34, 197, 94, 0.4)',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                onClick={onAccept}
                title="Принять вызов (Enter)"
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 28px rgba(34, 197, 94, 0.45)',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* Иконка ответа на звонок */}
                {isVideo ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1.01A11.36 11.36 0 0 1 8.57 3.9c0-.55-.45-1-1-1H4.02c-.55 0-1 .45-1 1 0 9.39 7.63 17.02 17.02 17.02.55 0 1-.45 1-1v-3.54c0-.55-.45-1-1-1z" />
                  </svg>
                )}
              </motion.button>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>Принять</span>
            </div>
          </div>

          {/* Подсказка горячих клавиш */}
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: 12,
            }}
          >
            Enter — ответить • Esc — отклонить
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
