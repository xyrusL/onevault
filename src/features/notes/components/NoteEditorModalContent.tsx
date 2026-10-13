import React, { useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  Check,
  CheckSquare,
  CircleNotch,
  Code,
  CornersOut,
  FolderSimple,
  ListBullets,
  PushPin,
  Quotes,
  Tag,
  TextB,
  TextHOne,
  TextHTwo,
  TextItalic,
  Trash,
  X,
} from '@phosphor-icons/react';
import { CustomSelect, SelectOption } from '../../../shared/components/forms/CustomSelect';
import { CreateNotePayload, Note, NoteColor, NoteFolder, UpdateNotePayload } from '../types/notes.types';
import { NOTE_COLOR_THEMES } from '../utils/note-colors.utils';
import {
  contentToHtml,
  executeEditorToolbarAction,
  isEditorToolActive,
} from '../utils/note-format.utils';

interface NoteEditorModalContentProps {
  note?: Note | null;
  folders: NoteFolder[];
  initialFolderId?: string | null;
  onCancel: () => void;
  onSave: (payload: CreateNotePayload | UpdateNotePayload) => Promise<void>;
  onDelete?: (note: Note) => void;
  onOpenFullView?: (draft: {
    title: string;
    content: string;
    folderId: string;
    color: NoteColor;
    isPinned: boolean;
    tags: string[];
  }) => void;
}

export const NoteEditorModalContent: React.FC<NoteEditorModalContentProps> = ({
  note,
  folders,
  initialFolderId,
  onCancel,
  onSave,
  onDelete,
  onOpenFullView,
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

  // Trigger reactive re-renders on every editor transaction or selection change
  const [, setEditorTransactionTrigger] = useState(0);

  // Initialize Tiptap Rich-Text Editor with full formatting and task list extensions
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
        placeholder: 'Write your note with headings, checklists, bullet lists, or thoughts...',
      }),
    ],
    content: contentToHtml(note?.content ?? ''),
    onTransaction: () => {
      setEditorTransactionTrigger((prev) => prev + 1);
    },
    onSelectionUpdate: () => {
      setEditorTransactionTrigger((prev) => prev + 1);
    },
    editorProps: {
      attributes: {
        class:
          'min-h-full w-full bg-transparent text-xs sm:text-sm text-fg-primary focus:outline-none leading-relaxed',
      },
    },
  });

  // Folder dropdown options: None for no folder
  const folderOptions: SelectOption[] = [
    { value: '', label: 'None' },
    ...folders.map((f) => ({
      value: f.id,
      label: f.name,
      badge: `${f.noteCount} notes`,
    })),
  ];

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

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the note.');
      return;
    }

    const htmlContent = editor ? editor.getHTML() : '';

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        content: htmlContent,
        folderId: folderId || null,
        color,
        isPinned,
        tags,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note.');
      setIsSubmitting(false);
    }
  };

  const handleTriggerFullView = () => {
    if (onOpenFullView) {
      onOpenFullView({
        title,
        content: editor ? editor.getHTML() : note?.content ?? '',
        folderId,
        color,
        isPinned,
        tags,
      });
    }
  };

  const colorKeys = Object.keys(NOTE_COLOR_THEMES) as NoteColor[];

  return (
    <form onSubmit={handleSave} className="space-y-3">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-danger/10 border border-danger/20 p-2.5 text-xs text-danger font-medium"
        >
          {error}
        </div>
      )}

      {/* Top Metadata Row: Folder selection, Pin button, and Color picker palette */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-elevated/70 border border-default rounded-xl p-2.5">
        {/* Folder Select with None */}
        <div className="flex items-center gap-2 min-w-44 flex-1">
          <FolderSimple size={16} weight="duotone" className="shrink-0 text-fg-muted" />
          <div className="flex-1">
            <CustomSelect
              value={folderId}
              options={folderOptions}
              onChange={(val) => setFolderId(val)}
              placeholder="Assign to folder"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Color Swatches (Google Keep style) */}
          <div className="flex items-center gap-1.5 bg-surface border border-default rounded-lg px-2 py-1 shadow-2xs">
            <span className="text-[10px] font-semibold text-fg-muted mr-0.5">
              Color:
            </span>
            {colorKeys.map((c) => {
              const theme = NOTE_COLOR_THEMES[c];
              const isSelected = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  title={theme.label}
                  className={`h-5 w-5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'border-accent scale-110 shadow-xs'
                      : 'border-black/20 hover:scale-105'
                  }`}
                  style={{ backgroundColor: theme.dotColor }}
                >
                  {isSelected && (
                    <Check
                      size={10}
                      weight="bold"
                      className={c === 'default' ? 'text-white' : 'text-black'}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pin Button */}
          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Pinned to top' : 'Pin note to top'}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              isPinned
                ? 'bg-accent text-accent-fg border-accent shadow-xs'
                : 'border-default bg-surface text-fg-secondary hover:text-fg-primary'
            }`}
          >
            <PushPin
              size={13}
              weight={isPinned ? 'fill' : 'bold'}
              className={isPinned ? 'rotate-45' : ''}
            />
            <span className="hidden sm:inline">
              {isPinned ? 'Pinned' : 'Pin'}
            </span>
          </button>

          {/* Full-Screen Canvas Button */}
          {onOpenFullView && (
            <button
              type="button"
              onClick={handleTriggerFullView}
              title="Expand to Full View Canvas (occupy entire screen for deep writing, graphs & media)"
              className="inline-flex items-center gap-1.5 rounded-lg border border-default bg-surface hover:bg-elevated px-2.5 py-1 text-xs font-medium text-fg-secondary hover:text-accent transition-colors cursor-pointer shadow-2xs"
            >
              <CornersOut size={13} weight="bold" className="text-accent" />
              <span className="hidden sm:inline">Full View</span>
            </button>
          )}
        </div>
      </div>

      {/* Title Input */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title..."
          autoFocus={!note}
          className="w-full bg-transparent font-display text-base sm:text-lg font-bold text-fg-primary placeholder:text-fg-placeholder border-b border-subtle pb-2 focus:outline-none focus:border-accent"
        />
      </div>

      {/* Tiptap Formatting Toolbar with Instant Toggles & Undo / Redo */}
      <div className="flex items-center flex-wrap gap-1 border-y border-subtle py-1.5">
        {/* Undo */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          title="Undo (Ctrl+Z)"
          className="flex h-7 w-7 items-center justify-center rounded-md text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all active:scale-95"
        >
          <ArrowUUpLeft size={15} weight="bold" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          title="Redo (Ctrl+Y)"
          className="flex h-7 w-7 items-center justify-center rounded-md text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all active:scale-95"
        >
          <ArrowUUpRight size={15} weight="bold" />
        </button>

        <span className="h-4 w-px bg-subtle mx-0.5" />

        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeEditorToolbarAction(editor, 'bold')}
          title="Bold (Ctrl+B)"
          className={`flex h-7 w-7 items-center justify-center rounded-md cursor-pointer transition-all active:scale-95 ${
            isEditorToolActive(editor, 'bold')
              ? 'bg-accent text-accent-fg font-bold shadow-xs ring-1 ring-accent/30'
              : 'text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <TextB size={15} weight="bold" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeEditorToolbarAction(editor, 'italic')}
          title="Italic (Ctrl+I)"
          className={`flex h-7 w-7 items-center justify-center rounded-md cursor-pointer transition-all active:scale-95 ${
            isEditorToolActive(editor, 'italic')
              ? 'bg-accent text-accent-fg font-bold shadow-xs ring-1 ring-accent/30'
              : 'text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <TextItalic size={15} weight="bold" />
        </button>

        {/* H1 Heading */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeEditorToolbarAction(editor, 'h1')}
          title="Heading 1"
          className={`flex h-7 w-7 items-center justify-center rounded-md cursor-pointer transition-all active:scale-95 ${
            isEditorToolActive(editor, 'h1')
              ? 'bg-accent text-accent-fg font-bold shadow-xs ring-1 ring-accent/30'
              : 'text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <TextHOne size={15} weight="bold" />
        </button>

        {/* H2 Heading */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeEditorToolbarAction(editor, 'h2')}
          title="Heading 2"
          className={`flex h-7 w-7 items-center justify-center rounded-md cursor-pointer transition-all active:scale-95 ${
            isEditorToolActive(editor, 'h2')
              ? 'bg-accent text-accent-fg font-bold shadow-xs ring-1 ring-accent/30'
              : 'text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <TextHTwo size={15} weight="bold" />
        </button>

        <span className="h-4 w-px bg-subtle mx-0.5" />

        {/* Bullet List */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeEditorToolbarAction(editor, 'bulletList')}
          title="Bullet List"
          className={`flex h-7 w-7 items-center justify-center rounded-md cursor-pointer transition-all active:scale-95 ${
            isEditorToolActive(editor, 'bulletList')
              ? 'bg-accent text-accent-fg font-bold shadow-xs ring-1 ring-accent/30'
              : 'text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <ListBullets size={15} weight="bold" />
        </button>

        {/* Interactive Task / Checklist */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeEditorToolbarAction(editor, 'taskList')}
          title="Checklist Tasks"
          className={`flex h-7 w-7 items-center justify-center rounded-md cursor-pointer transition-all active:scale-95 ${
            isEditorToolActive(editor, 'taskList')
              ? 'bg-accent text-accent-fg font-bold shadow-xs ring-1 ring-accent/30'
              : 'text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <CheckSquare size={15} weight="bold" />
        </button>

        {/* Quote */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeEditorToolbarAction(editor, 'blockquote')}
          title="Blockquote"
          className={`flex h-7 w-7 items-center justify-center rounded-md cursor-pointer transition-all active:scale-95 ${
            isEditorToolActive(editor, 'blockquote')
              ? 'bg-accent text-accent-fg font-bold shadow-xs ring-1 ring-accent/30'
              : 'text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <Quotes size={15} weight="bold" />
        </button>

        {/* Code Block */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeEditorToolbarAction(editor, 'codeBlock')}
          title="Code Block"
          className={`flex h-7 w-7 items-center justify-center rounded-md cursor-pointer transition-all active:scale-95 ${
            isEditorToolActive(editor, 'codeBlock')
              ? 'bg-accent text-accent-fg font-bold shadow-xs ring-1 ring-accent/30'
              : 'text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <Code size={15} weight="bold" />
        </button>

        {/* Full-Screen Canvas Button in toolbar */}
        {onOpenFullView && (
          <button
            type="button"
            onClick={handleTriggerFullView}
            title="Open Full View Note Canvas (Graphs & Media Embeds)"
            className="flex items-center gap-1 px-2 h-7 rounded-md text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10 text-xs font-mono ml-auto cursor-pointer transition-all active:scale-95"
          >
            <CornersOut size={13} weight="bold" className="text-accent" />
            <span className="text-[10.5px] hidden sm:inline">Canvas</span>
          </button>
        )}
      </div>

      {/* Tiptap WYSIWYG Content Container */}
      <div className="rounded-xl border border-default bg-surface/50 p-3 h-56 max-h-56 sm:h-64 sm:max-h-64 overflow-y-auto cursor-text" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>

      {/* Tags Input */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-fg-secondary uppercase tracking-wider block">
          Tags & Categories
        </label>
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-elevated/50 border border-default min-h-9">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-surface border border-default px-2 py-0.5 text-xs font-medium text-fg-primary shadow-2xs"
            >
              <Tag size={11} className="text-accent" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-fg-muted hover:text-danger cursor-pointer ml-0.5"
              >
                <X size={10} weight="bold" />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={handleAddTag}
            placeholder={tags.length === 0 ? 'Type a tag and press Enter...' : 'Add more...'}
            className="flex-1 min-w-28 bg-transparent text-xs text-fg-primary placeholder:text-fg-placeholder focus:outline-none px-1"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2.5 border-t border-subtle">
        <div>
          {note && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(note)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            >
              <Trash size={14} />
              <span className="hidden sm:inline">Delete Note</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-lg border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary disabled:opacity-60 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg px-4 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer transition-colors"
          >
            {isSubmitting ? (
              <>
                <CircleNotch size={14} weight="bold" className="animate-spin" />
                <span>Saving Note...</span>
              </>
            ) : (
              <span>{note ? 'Save Changes' : 'Create Note'}</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
