import React from 'react';
import {
  Globe,
  Trash,
  VideoCamera,
  SpeakerHigh,
  ArrowSquareOut,
  PlayCircle,
} from '@phosphor-icons/react';
import { NoteEmbedConfig } from '../../types/notes.types';
import { getYouTubeEmbedUrl } from '../../utils/note-embed.utils';

interface NoteEmbedMediaWidgetProps {
  embed: NoteEmbedConfig;
  onRemove?: (id: string) => void;
  readOnly?: boolean;
}

export const NoteEmbedMediaWidget: React.FC<NoteEmbedMediaWidgetProps> = ({
  embed,
  onRemove,
  readOnly = false,
}) => {
  const youtubeEmbedUrl = embed.type === 'youtube' ? getYouTubeEmbedUrl(embed.url) : null;

  return (
    <div className="my-3 rounded-xl border border-default bg-surface/90 shadow-xs overflow-hidden transition-all">
      {/* Widget Header with Type Badge, URL / Title & Remove Button */}
      <div className="flex items-center justify-between px-3 py-2 bg-elevated/60 border-b border-subtle text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {embed.type === 'youtube' ? (
            <span className="flex items-center gap-1 text-red-500 font-semibold font-mono text-[11px]">
              <PlayCircle size={15} weight="fill" />
              <span>YouTube Video</span>
            </span>
          ) : embed.type === 'video' ? (
            <span className="flex items-center gap-1 text-blue-500 font-semibold font-mono text-[11px]">
              <VideoCamera size={15} weight="fill" />
              <span>Embedded Video</span>
            </span>
          ) : embed.type === 'audio' ? (
            <span className="flex items-center gap-1 text-emerald-500 font-semibold font-mono text-[11px]">
              <SpeakerHigh size={15} weight="fill" />
              <span>Audio Clip</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-accent font-semibold font-mono text-[11px]">
              <Globe size={15} weight="fill" />
              <span>Web Resource</span>
            </span>
          )}

          <span className="text-subtle font-mono">|</span>

          <span className="text-fg-secondary truncate text-[11px] font-sans">
            {embed.title || embed.url}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={embed.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open link in new browser tab"
            className="p-1 rounded-md text-fg-muted hover:text-fg-primary hover:bg-elevated transition-colors"
          >
            <ArrowSquareOut size={13} weight="bold" />
          </a>

          {!readOnly && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(embed.id)}
              title="Remove embed from note"
              className="p-1 rounded-md text-fg-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            >
              <Trash size={13} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Media Body */}
      <div className="p-3 bg-canvas/30">
        {embed.type === 'youtube' && youtubeEmbedUrl ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-subtle bg-black">
            <iframe
              src={youtubeEmbedUrl}
              title={embed.title || 'YouTube video player'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        ) : embed.type === 'video' ? (
          <div className="rounded-lg overflow-hidden border border-subtle bg-black/90">
            <video
              src={embed.url}
              controls
              preload="metadata"
              className="w-full max-h-80 object-contain rounded-lg"
            >
              Your browser does not support HTML5 video tags.
            </video>
          </div>
        ) : embed.type === 'audio' ? (
          <div className="p-2 rounded-lg bg-surface border border-subtle">
            <audio src={embed.url} controls className="w-full" preload="metadata">
              Your browser does not support HTML5 audio tags.
            </audio>
          </div>
        ) : (
          /* Web Link Card */
          <a
            href={embed.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-lg border border-subtle bg-surface hover:bg-elevated/60 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/20">
                <Globe size={18} weight="duotone" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-fg-primary group-hover:text-accent truncate">
                  {embed.title || embed.url}
                </h4>
                <p className="text-[11px] text-fg-muted font-mono truncate mt-0.5">
                  {embed.url}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1 font-mono">
                  <span>Interactive Live Link</span>
                  <span>·</span>
                  <span className="underline">Click to view source</span>
                </div>
              </div>
            </div>
          </a>
        )}
      </div>
    </div>
  );
};
