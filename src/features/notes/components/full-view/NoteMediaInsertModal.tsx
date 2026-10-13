import React, { useState } from 'react';
import {
  PlayCircle,
  VideoCamera,
  SpeakerHigh,
  Globe,
  Plus,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';
import { NoteEmbedConfig } from '../../types/notes.types';
import { detectEmbedType } from '../../utils/note-embed.utils';

interface NoteMediaInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (embed: NoteEmbedConfig) => void;
}

const PRESET_LINKS = [
  {
    label: 'YouTube Video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Cloudflare Worker Demo',
    icon: <PlayCircle size={14} className="text-red-500" />,
  },
  {
    label: 'Web Resource',
    url: 'https://developers.cloudflare.com/workers/',
    title: 'Cloudflare Workers Documentation',
    icon: <Globe size={14} className="text-accent" />,
  },
  {
    label: 'Audio Stream',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Background Audio Sample',
    icon: <SpeakerHigh size={14} className="text-emerald-500" />,
  },
];

export const NoteMediaInsertModal: React.FC<NoteMediaInsertModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const detectedType = url ? detectEmbedType(url) : 'link';

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide a URL to embed.');
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setError('Please provide a valid URL format (e.g. https://...)');
      return;
    }

    const newEmbed: NoteEmbedConfig = {
      id: `embed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: url.trim(),
      type: detectedType,
      title: title.trim() || undefined,
    };

    onInsert(newEmbed);
    setUrl('');
    setTitle('');
    setError(null);
    onClose();
  };

  const handleApplyPreset = (presetUrl: string, presetTitle: string) => {
    setUrl(presetUrl);
    setTitle(presetTitle);
    setError(null);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Embed URL or Playable Media"
      subtitle="Embed YouTube videos, MP4 video, audio files, or live web bookmarks directly inside your note."
      icon={<PlayCircle size={18} weight="duotone" className="text-accent" />}
      maxWidthClass="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-default hover:bg-elevated text-xs font-medium text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-accent-fg hover:bg-accent-hover text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={13} weight="bold" />
            <span>Insert Embed</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleInsert} className="space-y-3.5 text-xs font-sans">
        {error && (
          <div className="p-2 rounded-lg bg-danger/10 border border-danger/25 text-danger text-[11px] font-medium">
            {error}
          </div>
        )}

        {/* URL Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono font-semibold uppercase text-fg-secondary">
            Resource URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://www.youtube.com/watch?v=... or https://example.com"
            autoFocus
            className="w-full rounded-xl bg-elevated/50 border border-default px-3 py-2 text-xs text-fg-primary placeholder:text-fg-placeholder focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        {/* Detected Type Badge */}
        {url && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-elevated/40 border border-subtle font-mono text-[11px]">
            <span className="text-fg-muted">Detected Type:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-accent">
              {detectedType === 'youtube' ? (
                <>
                  <PlayCircle size={14} className="text-red-500" />
                  <span>Playable YouTube Player</span>
                </>
              ) : detectedType === 'video' ? (
                <>
                  <VideoCamera size={14} className="text-blue-500" />
                  <span>Playable HTML5 Video</span>
                </>
              ) : detectedType === 'audio' ? (
                <>
                  <SpeakerHigh size={14} className="text-emerald-500" />
                  <span>Playable Audio Player</span>
                </>
              ) : (
                <>
                  <Globe size={14} className="text-accent" />
                  <span>Live Web Link Card</span>
                </>
              )}
            </span>
          </div>
        )}

        {/* Optional Title Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono font-semibold uppercase text-fg-secondary">
            Display Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Architecture Overview Video"
            className="w-full rounded-xl bg-elevated/50 border border-default px-3 py-2 text-xs text-fg-primary placeholder:text-fg-placeholder focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        {/* Quick Sample Presets */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-mono uppercase text-fg-muted">
            Quick Sample Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {PRESET_LINKS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset.url, preset.title)}
                className="flex items-center gap-1.5 p-2 rounded-lg border border-subtle bg-elevated/30 hover:bg-elevated/70 text-left transition-colors cursor-pointer"
              >
                {preset.icon}
                <span className="text-[10.5px] text-fg-secondary truncate font-medium">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </BaseModal>
  );
};
