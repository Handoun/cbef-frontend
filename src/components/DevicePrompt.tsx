import { motion } from 'framer-motion';

interface DevicePromptProps {
  onSelect: (device: 'desktop' | 'phone') => void;
}

export default function DevicePrompt({ onSelect }: DevicePromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 3000,
      }}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        style={{
          background: 'var(--sidebar-bg)', padding: 30, borderRadius: 24,
          textAlign: 'center', color: 'var(--text-primary)', maxWidth: 400,
        }}
      >
        <h3 style={{ marginBottom: 16 }}>С какого устройства вы заходите?</h3>
        <button
          onClick={() => onSelect('desktop')}
          style={{
            display: 'block', width: '100%', marginBottom: 12, padding: 14,
            borderRadius: 40, background: '#0084ff', color: 'white',
            border: 'none', fontWeight: 600, cursor: 'pointer',
          }}
        >
          💻 Компьютер
        </button>
        <button
          onClick={() => onSelect('phone')}
          style={{
            display: 'block', width: '100%', padding: 14,
            borderRadius: 40, background: 'var(--button-bg)',
            color: 'var(--button-text)', border: 'none', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          📱 Телефон
        </button>
      </motion.div>
    </motion.div>
  );
}