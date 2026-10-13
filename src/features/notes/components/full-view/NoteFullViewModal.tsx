import React, { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import {
  NotePencil,
  CornersIn,
  CircleNotch,
  Tag,
  X,
  ChartPieSlice,
  PlayCircle,
  FloppyDisk,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';
import {
  CreateNotePayload,
  Note,
  NoteChartConfig,
  NoteColor,
  NoteEmbedConfig,
  NoteFolder,
  UpdateNotePayload,
} from '../../types/notes.types';
import { contentToHtml } from '../../utils/note-format.utils';
import {
  chartToHtml,
  embedToHtml,
  parseChartsAndEmbedsFromHtml,
} from '../../utils/note-embed.utils';
import { NoteFullViewToolbar } from './NoteFullViewToolbar';
import { NoteChartWidget } from './NoteChartWidget';
import { NoteEmbedMediaWidget } from './NoteEmbedMediaWidget';
import { NoteChartInsertModal } from './NoteChartInsertModal';
import { NoteMediaInsertModal } from './NoteMediaInsertModal';

interface NoteFullViewModalProps {
  isOpen: boolean;
  note?: Note | null;
  folders: NoteFolder[];
  initialFolderId?: string | null;
  onClose: () => void;
  onExitToStandardModal?: (draft: {
    title: string;
    content: string;
    folderId: string;
    color: NoteColor;
    isPinned: boolean;
    tags: string[];
  }) => void;
  onSave: (payload: CreateNotePayload | UpdateNotePayload) => Promise<void>;
}

export const NoteFullViewModal: React.FC<NoteFullViewModalProps> = ({
  isOpen,
  note,
  folders,
  initialFolderId,
  onClose,
  onExitToStandardModal,
  onSave,
}) => {
  const [title, setTitle] = useState(note?.title ?? '');
  const [folderId, setFolderId] = useState<string>(
    note?.folderId ?? initialFolderId ?? ''
  );
  const [color, setColor] = useState<NoteColor>(note?.color ?? 'default');
  const [isPinned, setIsPinned] = useState(note?.isPinned ?? false);
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sub-modals for adding embeds and charts
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  // Embedded widgets state
  const [charts, setCharts] = useState<NoteChartConfig[]>([]);
  const [embeds, setEmbeds] = useState<NoteEmbedConfig[]>([]);

  // Initialize and synchronize content when modal opens or note changes
  useEffect(() => {
    if (isOpen) {
      setTitle(note?.title ?? '');
      setFolderId(note?.folderId ?? initialFolderId ?? '');
      setColor(note?.color ?? 'default');
      setIsPinned(note?.isPinned ?? false);
      setTags(note?.tags ?? []);
      setError(null);

      // Parse existing charts and embeds from note content
      const rawContent = note?.content ?? '';
      const parsed = parseChartsAndEmbedsFromHtml(rawContent);
      setCharts(parsed.charts);
      setEmbeds(parsed.embeds);
    }
  }, [isOpen, note, initialFolderId]);

  // Trigger reactive re-renders on every editor transaction or selection change
  const [, setEditorTransactionTrigger] = useState(0);

  // Tiptap Rich-Text Editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      Placeholder.configure({
        placeholder:
          'Full-screen note canvas: type thoughts, format headings, and insert interactive graphs or playable media...',
      }),
    ],
    content: note?.content
      ? contentToHtml(parseChartsAndEmbedsFromHtml(note.content).cleanHtml)
      : '<p><br></p>',
    onTransaction: () => {
      setEditorTransactionTrigger((prev) => prev + 1);
    },
    onSelectionUpdate: () => {
      setEditorTransactionTrigger((prev) => prev + 1);
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[300px] w-full bg-transparent text-sm sm:text-base text-fg-primary focus:outline-none leading-relaxed',
      },
    },
  });

  // Re-sync Tiptap content if note changes while editor is active
  useEffect(() => {
    if (editor && isOpen && note) {
      const parsed = parseChartsAndEmbedsFromHtml(note.content);
      const html = contentToHtml(parsed.cleanHtml);
      if (editor.getHTML() !== html) {
        editor.commands.setContent(html);
      }
    }
  }, [editor, isOpen, note]);

  // Tag helpers
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Embed helpers
  const handleInsertMedia = (newEmbed: NoteEmbedConfig) => {
    setEmbeds((prev) => [...prev, newEmbed]);
  };

  const handleRemoveMedia = (id: string) => {
    setEmbeds((prev) => prev.filter((e) => e.id !== id));
  };

  // Chart helpers
  const handleInsertChart = (newChart: NoteChartConfig) => {
    setCharts((prev) => [...prev, newChart]);
  };

  const handleRemoveChart = (id: string) => {
    setCharts((prev) => prev.filter((c) => c.id !== id));
  };

  // Bundle content with charts and embeds
  const buildFullContent = (): string => {
    let html = editor ? editor.getHTML() : '';
    // Append chart placeholders
    for (const c of charts) {
      html += chartToHtml(c);
    }
    // Append embed placeholders
    for (const e of embeds) {
      html += embedToHtml(e);
    }
    return html;
  };

  // Exit back to standard modal with current draft preserved
  const handleExitToStandard = () => {
    const fullHtml = buildFullContent();
    if (onExitToStandardModal) {
      onExitToStandardModal({
        title: title.trim(),
        content: fullHtml,
        folderId,
        color,
        isPinned,
        tags,
      });
    } else {
      onClose();
    }
  };

  // Save handler
  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please provide a title for the note.');
      return;
    }

    const fullHtml = buildFullContent();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        content: fullHtml,
        folderId: folderId || null,
        color,
        isPinned,
        tags,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Sub-Modal: Insert Media URL */}
      <NoteMediaInsertModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onInsert={handleInsertMedia}
      />

      {/* Sub-Modal: Insert Interactive Graph */}
      <NoteChartInsertModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        onInsert={handleInsertChart}
      />

      {/* Main Full-Screen Modal Shell */}
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={title || 'Full View Note Canvas'}
        subtitle="Full-screen immersive note editor with playable media embeds & interactive Recharts graphs"
        icon={<NotePencil size={18} weight="duotone" className="text-accent" />}
        maxWidthClass="max-w-[97vw] w-[97vw]"
        footer={
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-3 text-xs font-mono text-fg-muted">
              <span className="flex items-center gap-1">
                <ChartPieSlice size={13} className="text-blue-400" />
                <span>{charts.length} Chart{charts.length === 1 ? '' : 's'}</span>
              </span>
              <span className="text-subtle">|</span>
              <span className="flex items-center gap-1">
                <PlayCircle size={13} className="text-red-400" />
                <span>{embeds.length} Media Embed{embeds.length === 1 ? '' : 's'}</span>
              </span>
              <span className="text-subtle">|</span>
              <span>{tags.length} Tag{tags.length === 1 ? '' : 's'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExitToStandard}
                title="Return to standard compact modal dialog"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-default bg-elevated hover:bg-surface text-xs font-medium text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
              >
                <CornersIn size={14} weight="bold" />
                <span>Standard View</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-lg hover:bg-elevated text-xs font-medium text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-accent-fg hover:bg-accent-hover text-xs font-semibold shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <CircleNotch size={14} weight="bold" className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FloppyDisk size={14} weight="bold" />
                    <span>Save Note</span>
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col h-[74vh] max-h-[74vh] space-y-3 font-sans">
          {error && (
            <div
              role="alert"
              className="p-2.5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs font-medium"
            >
              {error}
            </div>
          )}

          {/* Top Note Title Bar with Full-Screen Exit Toggle */}
          <div className="flex items-center justify-between gap-3 border-b border-subtle pb-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title..."
              autoFocus={!note}
              className="w-full bg-transparent font-display text-lg sm:text-2xl font-bold text-fg-primary placeholder:text-fg-placeholder focus:outline-none"
            />

            <button
              type="button"
              onClick={handleExitToStandard}
              title="Return to standard compact modal"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-default bg-elevated hover:bg-surface text-xs font-mono text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer shrink-0"
            >
              <CornersIn size={13} weight="bold" />
              <span className="hidden sm:inline">Compact</span>
            </button>
          </div>

          {/* Full-View Toolbar with Formatting, Media & Chart Inserters, Folders & Colors */}
          <NoteFullViewToolbar
            editor={editor}
            folders={folders}
            folderId={folderId}
            onFolderChange={(id) => setFolderId(id)}
            color={color}
            onColorChange={(c) => setColor(c)}
            isPinned={isPinned}
            onTogglePin={() => setIsPinned(!isPinned)}
            onOpenInsertChart={() => setIsChartModalOpen(true)}
            onOpenInsertMedia={() => setIsMediaModalOpen(true)}
          />

          {/* Writing Canvas & Widgets Container (Takes up maximum screen space) */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Tiptap Text Canvas */}
            <div
              className="rounded-xl border border-default/70 bg-surface/40 p-4 min-h-[300px] cursor-text transition-all focus-within:border-accent/60"
              onClick={() => editor?.commands.focus()}
            >
              <EditorContent editor={editor} />
            </div>

            {/* Embedded Interactive Charts Section */}
            {charts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-fg-muted uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <ChartPieSlice size={13} className="text-blue-500" />
                    <span>Embedded Interactive Graphs ({charts.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChartModalOpen(true)}
                    className="text-accent hover:underline cursor-pointer lowercase"
                  >
                    + add another graph
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {charts.map((chart) => (
                    <NoteChartWidget
                      key={chart.id}
                      chart={chart}
                      onRemove={handleRemoveChart}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Embedded Playable Media / Web Links Section */}
            {embeds.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-fg-muted uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <PlayCircle size={13} className="text-red-500" />
                    <span>Embedded Playable Media &amp; Web Resources ({embeds.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="text-accent hover:underline cursor-pointer lowercase"
                  >
                    + add another embed
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {embeds.map((embed) => (
                    <NoteEmbedMediaWidget
                      key={embed.id}
                      embed={embed}
                      onRemove={handleRemoveMedia}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compact Tags Strip at Bottom */}
          <div className="pt-2 border-t border-subtle flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-fg-muted flex items-center gap-1">
              <Tag size={12} className="text-accent" />
              <span>Tags:</span>
            </span>

            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-elevated border border-default px-2 py-0.5 text-[11px] font-medium text-fg-primary"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-fg-muted hover:text-danger cursor-pointer"
                >
                  <X size={10} weight="bold" />
                </button>
              </span>
            ))}

            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              onBlur={handleAddTag}
              placeholder="Add tag and press Enter..."
              className="bg-transparent text-xs text-fg-primary placeholder:text-fg-placeholder focus:outline-none min-w-36 py-0.5"
            />
          </div>
        </div>
      </BaseModal>
    </>
  );
};
