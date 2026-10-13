import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  TextB,
  TextItalic,
  TextHOne,
  TextHTwo,
  ListBullets,
  CheckSquare,
  Quotes,
  Code,
  ChartPieSlice,
  PlayCircle,
  PushPin,
  Check,
  FolderSimple,
} from '@phosphor-icons/react';
import { CustomSelect, SelectOption } from '../../../../shared/components/forms/CustomSelect';
import { NoteColor, NoteFolder } from '../../types/notes.types';
import { NOTE_COLOR_THEMES } from '../../utils/note-colors.utils';
import {
  executeEditorToolbarAction,
  isEditorToolActive,
} from '../../utils/note-format.utils';

interface NoteFullViewToolbarProps {
  editor: Editor | null;
  folders: NoteFolder[];
  folderId: string;
  onFolderChange: (folderId: string) => void;
  color: NoteColor;
  onColorChange: (color: NoteColor) => void;
  isPinned: boolean;
  onTogglePin: () => void;
  onOpenInsertChart: () => void;
  onOpenInsertMedia: () => void;
}

export const NoteFullViewToolbar: React.FC<NoteFullViewToolbarProps> = ({
  editor,
  folders,
  folderId,
  onFolderChange,
  color,
  onColorChange,
  isPinned,
  onTogglePin,
  onOpenInsertChart,
  onOpenInsertMedia,
}) => {
  const colorKeys = Object.keys(NOTE_COLOR_THEMES) as NoteColor[];

  // Double guarantee: subscribe directly to editor transactions and selection changes
  const [, setToolbarUpdateTrigger] = React.useState(0);
  React.useEffect(() => {
    if (!editor) return;
    const updateHandler = () => setToolbarUpdateTrigger((prev) => prev + 1);
    editor.on('transaction', updateHandler);
    editor.on('selectionUpdate', updateHandler);
    return () => {
      editor.off('transaction', updateHandler);
      editor.off('selectionUpdate', updateHandler);
    };
  }, [editor]);

  const folderOptions: SelectOption[] = [
    { value: '', label: 'None (Unfiled)' },
    ...folders.map((f) => ({
      value: f.id,
      label: f.name,
      badge: `${f.noteCount} notes`,
    })),
  ];

  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-elevated/70 border border-default flex-wrap text-xs">
      {/* Left Segment: Tiptap Text Formatting Buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Undo */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          title="Undo (Ctrl+Z)"
          className="flex h-7 w-7 items-center justify-center rounded-md text-fg-secondary hover:text-fg-primary hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all active:scale-95"
        >
          <ArrowUUpLeft size={14} weight="bold" />
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
          <ArrowUUpRight size={14} weight="bold" />
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
          <TextB size={14} weight="bold" />
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
          <TextItalic size={14} weight="bold" />
        </button>

        {/* H1 */}
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
          <TextHOne size={14} weight="bold" />
        </button>

        {/* H2 */}
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
          <TextHTwo size={14} weight="bold" />
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
          <ListBullets size={14} weight="bold" />
        </button>

        {/* Task List */}
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
          <CheckSquare size={14} weight="bold" />
        </button>

        {/* Blockquote */}
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
          <Quotes size={14} weight="bold" />
        </button>

        {/* Code block */}
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
          <Code size={14} weight="bold" />
        </button>

        <span className="h-4 w-px bg-subtle mx-0.5" />

        {/* Insert Embed URL / Playable Media Button */}
        <button
          type="button"
          onClick={onOpenInsertMedia}
          title="Embed YouTube, Video, Audio, or Web URL"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-default hover:bg-black/10 dark:hover:bg-white/10 hover:text-accent font-medium text-fg-primary transition-all active:scale-95 cursor-pointer shadow-2xs"
        >
          <PlayCircle size={14} weight="bold" className="text-red-500" />
          <span className="font-mono text-[11px] font-semibold">+ Embed URL</span>
        </button>

        {/* Insert Interactive Graph / Chart Button */}
        <button
          type="button"
          onClick={onOpenInsertChart}
          title="Insert interactive Pie, Bar, or Line Chart"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-default hover:bg-black/10 dark:hover:bg-white/10 hover:text-accent font-medium text-fg-primary transition-all active:scale-95 cursor-pointer shadow-2xs"
        >
          <ChartPieSlice size={14} weight="bold" className="text-blue-500" />
          <span className="font-mono text-[11px] font-semibold">+ Insert Graph</span>
        </button>
      </div>

      {/* Right Segment: Folder Dropdown, Color Palette, and Pin Toggle */}
      <div className="flex items-center gap-2 flex-wrap ml-auto">
        {/* Compact Folder Select */}
        <div className="flex items-center gap-1.5 w-40">
          <FolderSimple size={15} weight="duotone" className="text-fg-muted shrink-0" />
          <div className="flex-1">
            <CustomSelect
              value={folderId}
              options={folderOptions}
              onChange={onFolderChange}
              placeholder="Assign folder"
            />
          </div>
        </div>

        {/* Color Palette Swatches */}
        <div className="flex items-center gap-1 bg-surface border border-default rounded-lg px-1.5 py-1 shadow-2xs">
          {colorKeys.map((c) => {
            const theme = NOTE_COLOR_THEMES[c];
            const isSelected = color === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onColorChange(c)}
                title={theme.label}
                className={`h-4.5 w-4.5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  isSelected ? 'border-accent scale-110 shadow-xs' : 'border-black/20 hover:scale-105'
                }`}
                style={{ backgroundColor: theme.dotColor }}
              >
                {isSelected && (
                  <Check
                    size={9}
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
          onClick={onTogglePin}
          title={isPinned ? 'Pinned note' : 'Pin note'}
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
            isPinned
              ? 'bg-accent text-accent-fg border-accent shadow-xs'
              : 'border-default bg-surface text-fg-secondary hover:text-fg-primary'
          }`}
        >
          <PushPin size={12} weight={isPinned ? 'fill' : 'bold'} className={isPinned ? 'rotate-45' : ''} />
          <span className="text-[11px] hidden sm:inline">{isPinned ? 'Pinned' : 'Pin'}</span>
        </button>
      </div>
    </div>
  );
};
