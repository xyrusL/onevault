import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CaretLeft,
  CaretRight,
  FolderSimple,
  NotePencil,
  Plus,
  Trash,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { BaseModal } from '../../shared/components/modals';
import { DeleteFolderModalContent } from './components/DeleteFolderModalContent';
import { DeleteNoteModalContent } from './components/DeleteNoteModalContent';
import { FolderEditorModalContent } from './components/FolderEditorModalContent';
import { NoteCard } from './components/NoteCard';
import { NoteEditorModalContent } from './components/NoteEditorModalContent';
import { NoteFolderCard } from './components/NoteFolderCard';
import { NoteNewCard } from './components/NoteNewCard';
import { NoteNewFolderCard } from './components/NoteNewFolderCard';
import { NotesHeader } from './components/NotesHeader';
import { NoteTimeFilterTabs } from './components/NoteTimeFilterTabs';
import { NoteFullViewModal } from './components/full-view/NoteFullViewModal';
import { notesService } from './services/notes.service';
import {
  CreateFolderPayload,
  CreateNotePayload,
  Note,
  NoteColor,
  NoteFolder,
  TimeFilterRange,
  UpdateFolderPayload,
  UpdateNotePayload,
} from './types/notes.types';

function isWithinRange(dateStr: string, range: TimeFilterRange): boolean {
  if (range === 'all') return true;
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (range === 'today') {
    return now - d <= dayMs;
  }
  if (range === 'week') {
    return now - d <= 7 * dayMs;
  }
  if (range === 'month') {
    return now - d <= 31 * dayMs;
  }
  return true;
}

export const NotesView: React.FC = () => {
  const cached = notesService.getCached();
  const [notes, setNotes] = useState<Note[]>(() => cached?.notes ?? []);
  const [folders, setFolders] = useState<NoteFolder[]>(() => cached?.folders ?? []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderFilterId, setSelectedFolderFilterId] = useState<string | null>(null);
  const [foldersTimeFilter, setFoldersTimeFilter] = useState<TimeFilterRange>('all');
  const [notesTimeFilter, setNotesTimeFilter] = useState<TimeFilterRange>('all');

  // Modals state
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  const [fullViewNote, setFullViewNote] = useState<Note | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null);
  const [pendingDeleteNote, setPendingDeleteNote] = useState<Note | null>(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<NoteFolder | null>(null);

  const loadData = useCallback(async () => {
    if (!notesService.getCached()) {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      const [fetchedFolders, fetchedNotes] = await Promise.all([
        notesService.listFolders(),
        notesService.listNotes(),
      ]);
      setFolders(fetchedFolders);
      setNotes(fetchedNotes);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load notes data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Virtual None folder info for unfiled notes
  const noneFolderInfo = useMemo<NoteFolder>(() => {
    const unfiledNotes = notes.filter((n) => !n.folderId);
    return {
      id: '__none__',
      name: 'None',
      color: 'default',
      icon: 'folder',
      noteCount: unfiledNotes.length,
      createdAt: unfiledNotes[0]?.createdAt ?? new Date().toISOString(),
      updatedAt: unfiledNotes[0]?.updatedAt ?? new Date().toISOString(),
    };
  }, [notes]);

  // Filtered Folders for Recent Folders Section
  const filteredFolders = useMemo(() => {
    return folders.filter((f) => isWithinRange(f.updatedAt, foldersTimeFilter));
  }, [folders, foldersTimeFilter]);

  // Filtered Notes for My Notes Section
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Folder filter (supports real folder id or __none__)
      if (selectedFolderFilterId === '__none__') {
        if (n.folderId !== null && n.folderId !== '') {
          return false;
        }
      } else if (selectedFolderFilterId && n.folderId !== selectedFolderFilterId) {
        return false;
      }

      // Time range filter
      if (!isWithinRange(n.updatedAt, notesTimeFilter)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesTags = n.tags.some((t) => t.toLowerCase().includes(q));
        const matchesFolder = n.folderName?.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesContent && !matchesTags && !matchesFolder) {
          return false;
        }
      }

      return true;
    });
  }, [notes, selectedFolderFilterId, notesTimeFilter, searchQuery]);

  const activeFilteredFolder = useMemo(() => {
    if (selectedFolderFilterId === '__none__') {
      return noneFolderInfo;
    }
    return folders.find((f) => f.id === selectedFolderFilterId);
  }, [folders, selectedFolderFilterId, noneFolderInfo]);

  // Note Handlers
  const handleSaveNote = async (
    payload: CreateNotePayload | UpdateNotePayload,
    targetNoteId?: string
  ) => {
    const noteIdToUpdate = targetNoteId || editingNote?.id;
    if (noteIdToUpdate) {
      const updated = await notesService.updateNote(noteIdToUpdate, payload);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setEditingNote(null);
    } else {
      const created = await notesService.createNote(payload as CreateNotePayload);
      setNotes((prev) => [created, ...prev]);
      setIsCreateNoteModalOpen(false);
    }
    // Refresh folders to sync note counts
    const updatedFolders = await notesService.listFolders();
    setFolders(updatedFolders);
  };

  const handleOpenFullViewWithDraft = (draft: {
    title: string;
    content: string;
    folderId: string;
    color: NoteColor;
    isPinned: boolean;
    tags: string[];
  }) => {
    const targetNote: Note = {
      id: editingNote?.id ?? '',
      title: draft.title,
      content: draft.content,
      folderId: draft.folderId || null,
      color: draft.color,
      isPinned: draft.isPinned,
      isArchived: editingNote?.isArchived ?? false,
      tags: draft.tags,
      createdAt: editingNote?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFullViewNote(targetNote);
    setIsCreateNoteModalOpen(false);
    setEditingNote(null);
    setIsFullViewOpen(true);
  };

  const handleExitFullViewToStandard = (draft: {
    title: string;
    content: string;
    folderId: string;
    color: NoteColor;
    isPinned: boolean;
    tags: string[];
  }) => {
    setIsFullViewOpen(false);
    if (fullViewNote?.id) {
      setEditingNote({
        ...fullViewNote,
        ...draft,
        folderId: draft.folderId || null,
      });
    } else {
      setIsCreateNoteModalOpen(true);
    }
  };

  const handleTogglePin = async (note: Note) => {
    const updated = await notesService.togglePin(note);
    setNotes((prev) =>
      prev
        .map((n) => (n.id === updated.id ? updated : n))
        .sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
    );
  };

  const handleToggleArchive = async (note: Note) => {
    const updated = await notesService.toggleArchive(note);
    setNotes((prev) => prev.filter((n) => n.id !== updated.id));
  };

  const handleConfirmDeleteNote = async (id: string) => {
    await notesService.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setPendingDeleteNote(null);
    setEditingNote(null);
    const updatedFolders = await notesService.listFolders();
    setFolders(updatedFolders);
  };

  // Folder Handlers
  const handleSaveFolder = async (
    payload: CreateFolderPayload | UpdateFolderPayload
  ) => {
    if (editingFolder) {
      const updated = await notesService.updateFolder(editingFolder.id, payload);
      setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      // Also update folderName on notes in state
      setNotes((prev) =>
        prev.map((n) =>
          n.folderId === updated.id
            ? { ...n, folderName: updated.name, folderColor: updated.color }
            : n
        )
      );
      setEditingFolder(null);
    } else {
      const created = await notesService.createFolder(payload as CreateFolderPayload);
      setFolders((prev) => [created, ...prev]);
      setIsCreateFolderModalOpen(false);
    }
  };

  const handleConfirmDeleteFolder = async (id: string) => {
    await notesService.deleteFolder(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setNotes((prev) =>
      prev.map((n) =>
        n.folderId === id ? { ...n, folderId: null, folderName: null, folderColor: null } : n
      )
    );
    if (selectedFolderFilterId === id) {
      setSelectedFolderFilterId(null);
    }
    setPendingDeleteFolder(null);
  };

  // Formatted Current Month & Year for Header
  const currentMonthDisplay = new Date().toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="flex-1 flex flex-col gap-6">
      {/* Top Header matching mockup */}
      <NotesHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateNote={() => setIsCreateNoteModalOpen(true)}
        onCreateFolder={() => setIsCreateFolderModalOpen(true)}
        onOpenFullViewCanvas={() => {
          setFullViewNote(null);
          setIsFullViewOpen(true);
        }}
        totalNotesCount={notes.length}
      />

      {loadError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg bg-surface border border-default px-3 py-2 text-xs font-medium text-danger"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <WarningCircle size={15} weight="fill" className="shrink-0" />
            <span className="truncate">{loadError}</span>
          </span>
          <button
            type="button"
            onClick={() => void loadData()}
            className="shrink-0 rounded-md border border-default bg-elevated px-2.5 py-1 text-fg-secondary hover:text-fg-primary cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* SECTION 1: Recent Folders (Matching User's Mockup) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="font-display text-sm sm:text-base font-bold text-fg-primary">
            Recent Folders
          </h2>
          <NoteTimeFilterTabs
            value={foldersTimeFilter}
            onChange={setFoldersTimeFilter}
          />
        </div>

        {/* Scrollable / Responsive Folder Cards Row */}
        <div className="flex items-center gap-3.5 overflow-x-auto py-3 px-1 scrollbar-none">
          {filteredFolders.map((folder) => (
            <NoteFolderCard
              key={folder.id}
              folder={folder}
              isSelected={selectedFolderFilterId === folder.id}
              onSelect={(f) => {
                // Clicking toggles filter
                setSelectedFolderFilterId((prev) => (prev === f.id ? null : f.id));
              }}
              onEdit={(f) => setEditingFolder(f)}
              onDelete={(f) => setPendingDeleteFolder(f)}
            />
          ))}

          {/* None (Unfiled notes) category card */}
          <NoteFolderCard
            folder={noneFolderInfo}
            isSelected={selectedFolderFilterId === '__none__'}
            onSelect={() => {
              setSelectedFolderFilterId((prev) => (prev === '__none__' ? null : '__none__'));
            }}
            onEdit={() => {}}
            onDelete={() => {}}
          />

          {/* "+ New folder" card from mockup */}
          <NoteNewFolderCard
            onClick={() => setIsCreateFolderModalOpen(true)}
          />
        </div>
      </div>

      {/* SECTION 2: My Notes (Matching User's Mockup) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm sm:text-base font-bold text-fg-primary">
              My Notes
            </h2>

            {/* Active Folder Filter Chip if user selected a folder */}
            {activeFilteredFolder && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold">
                <FolderSimple size={12} weight="fill" />
                <span>@{activeFilteredFolder.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedFolderFilterId(null)}
                  className="hover:text-fg-primary cursor-pointer ml-0.5"
                  title="Clear folder filter"
                >
                  <X size={11} weight="bold" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <NoteTimeFilterTabs
              value={notesTimeFilter}
              onChange={(val) => {
                setNotesTimeFilter(val);
                if (val === 'all') {
                  setSelectedFolderFilterId(null);
                }
              }}
            />

            {/* Date Navigator from Mockup */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-fg-muted font-medium bg-surface border border-default rounded-lg px-2 py-0.5 shadow-2xs">
              <button
                type="button"
                className="hover:text-fg-primary p-0.5 rounded cursor-pointer"
                title="Previous"
              >
                <CaretLeft size={12} weight="bold" />
              </button>
              <span className="text-[11px] font-semibold text-fg-secondary">
                {currentMonthDisplay}
              </span>
              <button
                type="button"
                className="hover:text-fg-primary p-0.5 rounded cursor-pointer"
                title="Next"
              >
                <CaretRight size={12} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid of Note Cards */}
        {isLoading && notes.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-surface/50 border border-default animate-pulse p-4 space-y-3"
              >
                <div className="h-4 bg-elevated rounded w-1/3" />
                <div className="h-5 bg-elevated rounded w-3/4" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-elevated rounded w-full" />
                  <div className="h-3 bg-elevated rounded w-5/6" />
                  <div className="h-3 bg-elevated rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={(n) => setEditingNote(n)}
                onOpenFullView={(n) => {
                  setFullViewNote(n);
                  setIsFullViewOpen(true);
                }}
                onTogglePin={handleTogglePin}
                onToggleArchive={handleToggleArchive}
                onDelete={(n) => setPendingDeleteNote(n)}
                onFilterByFolder={(fId) => setSelectedFolderFilterId(fId)}
              />
            ))}

            {/* "+ New Note" dashed card from mockup */}
            <NoteNewCard
              onClick={() => setIsCreateNoteModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* MODAL 1: Create Note */}
      <BaseModal
        isOpen={isCreateNoteModalOpen}
        onClose={() => setIsCreateNoteModalOpen(false)}
        title="Create New Note"
        subtitle="Notion / Google Keep style encrypted vault note."
        icon={<NotePencil size={15} weight="duotone" />}
        maxWidthClass="max-w-3xl"
      >
        <NoteEditorModalContent
          folders={folders}
          initialFolderId={selectedFolderFilterId}
          onCancel={() => setIsCreateNoteModalOpen(false)}
          onSave={handleSaveNote}
          onOpenFullView={handleOpenFullViewWithDraft}
        />
      </BaseModal>

      {/* MODAL 2: Edit Existing Note */}
      <BaseModal
        isOpen={Boolean(editingNote)}
        onClose={() => setEditingNote(null)}
        title="Edit Note"
        subtitle={editingNote?.title}
        icon={<NotePencil size={15} weight="duotone" />}
        maxWidthClass="max-w-3xl"
      >
        {editingNote && (
          <NoteEditorModalContent
            note={editingNote}
            folders={folders}
            onCancel={() => setEditingNote(null)}
            onSave={handleSaveNote}
            onOpenFullView={handleOpenFullViewWithDraft}
            onDelete={(note) => {
              setEditingNote(null);
              setPendingDeleteNote(note);
            }}
          />
        )}
      </BaseModal>

      {/* MODAL 3: Create Folder */}
      <BaseModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        title="Create New Folder"
        subtitle="Organize notes by topic, class, or project."
        icon={<Plus size={15} weight="bold" />}
      >
        <FolderEditorModalContent
          onCancel={() => setIsCreateFolderModalOpen(false)}
          onSave={handleSaveFolder}
        />
      </BaseModal>

      {/* MODAL 4: Edit Folder */}
      <BaseModal
        isOpen={Boolean(editingFolder)}
        onClose={() => setEditingFolder(null)}
        title="Edit Folder"
        subtitle={editingFolder?.name}
        icon={<FolderSimple size={15} weight="duotone" />}
      >
        {editingFolder && (
          <FolderEditorModalContent
            folder={editingFolder}
            onCancel={() => setEditingFolder(null)}
            onSave={handleSaveFolder}
          />
        )}
      </BaseModal>

      {/* MODAL 5: Delete Note Confirmation */}
      <BaseModal
        isOpen={Boolean(pendingDeleteNote)}
        onClose={() => setPendingDeleteNote(null)}
        title="Delete Note"
        subtitle="Permanent deletion confirmation."
        icon={<Trash size={15} weight="duotone" className="text-danger" />}
      >
        {pendingDeleteNote && (
          <DeleteNoteModalContent
            note={pendingDeleteNote}
            onCancel={() => setPendingDeleteNote(null)}
            onConfirm={handleConfirmDeleteNote}
          />
        )}
      </BaseModal>

      {/* MODAL 6: Delete Folder Confirmation */}
      <BaseModal
        isOpen={Boolean(pendingDeleteFolder)}
        onClose={() => setPendingDeleteFolder(null)}
        title="Delete Folder"
        subtitle="Confirm folder removal."
        icon={<Trash size={15} weight="duotone" className="text-danger" />}
      >
        {pendingDeleteFolder && (
          <DeleteFolderModalContent
            folder={pendingDeleteFolder}
            onCancel={() => setPendingDeleteFolder(null)}
            onConfirm={handleConfirmDeleteFolder}
          />
        )}
      </BaseModal>

      {/* MODAL 7: Full View Note Canvas (Fullscreen Immersive Editor with Graphs & Media) */}
      <NoteFullViewModal
        isOpen={isFullViewOpen}
        note={fullViewNote}
        folders={folders}
        initialFolderId={selectedFolderFilterId}
        onClose={() => {
          setIsFullViewOpen(false);
          setFullViewNote(null);
        }}
        onExitToStandardModal={handleExitFullViewToStandard}
        onSave={async (payload) => {
          await handleSaveNote(payload, fullViewNote?.id);
        }}
      />
    </section>
  );
};
