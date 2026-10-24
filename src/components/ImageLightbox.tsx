import { motion } from 'framer-motion';

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 3000,
      }}
      onClick={onClose}
    >
      <img
        src={src}
        alt="Просмотр"
        style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12, objectFit: 'contain' }}
        onClick={e => e.stopPropagation()}
      />
    </motion.div>
  );
}