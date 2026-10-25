import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StickerPack {
  id: string;
  name: string;
  author: string;
  isCustom?: boolean;
  stickers: string[]; // URLs or emoji
}

const DEFAULT_PACKS: StickerPack[] = [
  { id: 'emojis', name: 'Смайлы', author: 'CBEF', stickers: ['😊','😂','😍','👍','🎉','🔥','❤️','💯','🥳','😎','🤩','😇','🚀','✨','💩','👻'] },
  { id: 'animals', name: 'Животные', author: 'CBEF', stickers: ['🐶','🐱','🦊','🐼','🐨','🐸','🦄','🐙','🐳','🦋','🐞','🦜','🦁','🐯','🐵','🐧'] },
  { id: 'food', name: 'Еда', author: 'CBEF', stickers: ['🍔','🍕','🍣','🍩','🍓','🍇','🥑','🌮','🍿','🍪','🧁','🍭','🍰','🍉','🍦','🍫'] },
  { id: 'reactions', name: 'Реакции', author: 'CBEF', stickers: ['😱','🤯','😴','🤮','🤐','🤔','🤡','🤖','💀','👀','🤝','🙏','🤙','💪','🖕','👌'] },
];

interface StickerPackViewerProps {
  onSelectSticker: (urlOrEmoji: string) => void;
  onClose: () => void;
}

export default function StickerPackViewer({ onSelectSticker, onClose }: StickerPackViewerProps) {
  const [customPacks, setCustomPacks] = useState<StickerPack[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cbef_sticker_packs') || '[]');
    } catch {
      return [];
    }
  });

  const allPacks = [...DEFAULT_PACKS, ...customPacks];
  const [selectedPackId, setSelectedPackId] = useState<string>(allPacks[0]?.id || 'emojis');

  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [newPackName, setNewPackName] = useState('');

  const currentPack = allPacks.find(p => p.id === selectedPackId) || allPacks[0];

  const saveCustomPacks = (packs: StickerPack[]) => {
    setCustomPacks(packs);
    localStorage.setItem('cbef_sticker_packs', JSON.stringify(packs));
  };

  const handleCreatePack = () => {
    const name = newPackName.trim();
    if (!name) return;
    const newPack: StickerPack = {
      id: `custom_${Date.now()}`,
      name,
      author: 'Вы',
      isCustom: true,
      stickers: [],
    };
    const updated = [...customPacks, newPack];
    saveCustomPacks(updated);
    setSelectedPackId(newPack.id);
    setNewPackName('');
    setIsCreatingPack(false);
  };

  const handleAddStickerImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPack?.isCustom) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Размер стикера не должен превышать 8МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const stickerUrl = reader.result as string;
      const updatedPacks = customPacks.map(p => {
        if (p.id === currentPack.id) {
          return { ...p, stickers: [...p.stickers, stickerUrl] };
        }
        return p;
      });
      saveCustomPacks(updatedPacks);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeletePack = (packId: string) => {
    if (confirm('Удалить этот стикерпак?')) {
      const updated = customPacks.filter(p => p.id !== packId);
      saveCustomPacks(updated);
      setSelectedPackId('emojis');
    }
  };

  const handleDeleteSticker = (stickerIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPack?.isCustom) return;
    const updatedPacks = customPacks.map(p => {
      if (p.id === currentPack.id) {
        return {
          ...p,
          stickers: p.stickers.filter((_, idx) => idx !== stickerIndex),
        };
      }
      return p;
    });
    saveCustomPacks(updatedPacks);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 4000,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderRadius: 24,
          padding: 24,
          width: '92%',
          maxWidth: 540,
          maxHeight: '84vh',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-primary)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            📦 Стикеры и стикерпаки
          </h3>
          <button
            onClick={() => setIsCreatingPack(prev => !prev)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              backgroundColor: isCreatingPack ? '#ef4444' : '#0084ff',
              color: 'white',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isCreatingPack ? 'Отмена' : '➕ Создать пак'}
          </button>
        </div>

        {/* Форма создания стикерпака */}
        <AnimatePresence>
          {isCreatingPack && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                overflow: 'hidden',
                backgroundColor: 'var(--hover-bg)',
                padding: 14,
                borderRadius: 16,
                marginBottom: 16,
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                Название нового стикерпака
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Например: Мемы, Мой кот..."
                  value={newPackName}
                  onChange={e => setNewPackName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreatePack()}
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: 16,
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleCreatePack}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 16,
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Создать
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Вкладки стикерпаков */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 8,
            marginBottom: 14,
            scrollbarWidth: 'none',
          }}
        >
          {allPacks.map(pack => (
            <button
              key={pack.id}
              onClick={() => setSelectedPackId(pack.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: selectedPackId === pack.id ? '#0084ff' : 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                color: selectedPackId === pack.id ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: selectedPackId === pack.id ? 600 : 400,
                whiteSpace: 'nowrap',
                fontSize: 13,
                transition: 'all 0.15s',
              }}
            >
              {pack.isCustom ? `🎨 ${pack.name}` : pack.name}
            </button>
          ))}
        </div>

        {/* Инфо о паке и кнопка загрузки стикера */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Автор: {currentPack?.author || 'CBEF'} • Стикеры: {currentPack?.stickers?.length || 0}
          </div>

          {currentPack?.isCustom && (
            <div style={{ display: 'flex', gap: 8 }}>
              <label
                style={{
                  padding: '5px 12px',
                  borderRadius: 16,
                  backgroundColor: '#22c55e',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                ➕ Добавить стикер
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleAddStickerImage}
                />
              </label>

              <button
                onClick={() => handleDeletePack(currentPack.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 16,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                title="Удалить пак"
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        {/* Сетка стикеров */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            gap: 12,
            padding: '8px 4px',
            alignContent: 'start',
          }}
        >
          {currentPack?.stickers?.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: 14,
              }}
            >
              В этом стикерпаке пока пусто.
              <br />
              Нажмите <strong>«➕ Добавить стикер»</strong>, чтобы загрузить картинку!
            </div>
          ) : (
            currentPack?.stickers.map((sticker, idx) => {
              const isImage = sticker.startsWith('data:image') || sticker.startsWith('http');
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onSelectSticker(sticker)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 14,
                    backgroundColor: 'var(--hover-bg)',
                    userSelect: 'none',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {isImage ? (
                    <img
                      src={sticker}
                      alt="sticker"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 36 }}>{sticker}</span>
                  )}

                  {currentPack?.isCustom && (
                    <button
                      onClick={e => handleDeleteSticker(idx, e)}
                      title="Удалить стикер"
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            width: '100%',
            padding: 12,
            borderRadius: 20,
            border: 'none',
            background: 'var(--button-bg)',
            color: 'var(--button-text)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Закрыть
        </button>
      </motion.div>
    </motion.div>
  );
}
