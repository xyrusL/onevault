import { apiClient, apiRequest } from '../../../shared/services/api-client.service';
import type {
  CreateFolderPayload,
  CreateNotePayload,
  Note,
  NoteFolder,
  UpdateFolderPayload,
  UpdateNotePayload,
} from '../types/notes.types';

const NOTES_CACHE_KEY = 'onevault.notes.cache.v2';
const FOLDERS_CACHE_KEY = 'onevault.note-folders.cache.v2';

interface NotesCache {
  notes: Note[];
  folders: NoteFolder[];
}

let memoryNotes: Note[] | null = (() => {
  try {
    localStorage.removeItem('onevault.notes.cache.v1');
    const raw = localStorage.getItem(NOTES_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : null;
  } catch {
    return null;
  }
})();

let memoryFolders: NoteFolder[] | null = (() => {
  try {
    const raw = localStorage.getItem(FOLDERS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as NoteFolder[]) : null;
  } catch {
    return null;
  }
})();

function persistNotes(notes: Note[]) {
  memoryNotes = notes;
  try {
    localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(notes));
  } catch {
    // Ignore quota errors
  }
}

function persistFolders(folders: NoteFolder[]) {
  memoryFolders = folders;
  try {
    localStorage.setItem(FOLDERS_CACHE_KEY, JSON.stringify(folders));
  } catch {
    // Ignore quota errors
  }
}

export const notesService = {
  getCached(): NotesCache | null {
    if (memoryNotes && memoryFolders) {
      return { notes: memoryNotes, folders: memoryFolders };
    }
    return null;
  },

  async listFolders(): Promise<NoteFolder[]> {
    const folders = await apiRequest<NoteFolder[]>('/notes/folders');
    persistFolders(folders);
    return folders;
  },

  async createFolder(payload: CreateFolderPayload): Promise<NoteFolder> {
    const created = await apiRequest<NoteFolder>('/notes/folders', {
      method: 'POST',
      body: payload,
    });
    const current = memoryFolders ?? [];
    persistFolders([created, ...current]);
    return created;
  },

  async updateFolder(id: string, payload: UpdateFolderPayload): Promise<NoteFolder> {
    const current = memoryFolders ?? [];
    const existing = current.find((f) => f.id === id);
    const updated: NoteFolder = existing
      ? { ...existing, ...payload }
      : ({} as NoteFolder);

    if (existing) {
      persistFolders(current.map((f) => (f.id === id ? updated : f)));
    }

    await apiClient.syncPatch<NoteFolder>(
      `/notes/folders/${encodeURIComponent(id)}`,
      payload,
      `note_folder_${id}`,
      updated
    );
    return updated;
  },

  async deleteFolder(id: string): Promise<void> {
    await apiRequest(`/notes/folders/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const currentFolders = memoryFolders ?? [];
    persistFolders(currentFolders.filter((f) => f.id !== id));

    // Also update cached notes that belonged to this folder
    if (memoryNotes) {
      persistNotes(
        memoryNotes.map((n) =>
          n.folderId === id ? { ...n, folderId: null, folderName: null, folderColor: null } : n
        )
      );
    }
  },

  async listNotes(options?: {
    folderId?: string | null;
    search?: string;
    isArchived?: boolean;
  }): Promise<Note[]> {
    const params = new URLSearchParams();
    if (options?.folderId) params.set('folderId', options.folderId);
    if (options?.search) params.set('search', options.search);
    if (options?.isArchived !== undefined) {
      params.set('archived', String(options.isArchived));
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const notes = await apiRequest<Note[]>(`/notes${query}`);

    // If fetching full active list (no folder or search filter), persist to cache
    if (!options?.folderId && !options?.search && !options?.isArchived) {
      persistNotes(notes);
    }

    return notes;
  },

  async createNote(payload: CreateNotePayload): Promise<Note> {
    const created = await apiRequest<Note>('/notes', {
      method: 'POST',
      body: payload,
    });
    const current = memoryNotes ?? [];
    persistNotes([created, ...current]);

    // Update folder note count in cache
    if (created.folderId && memoryFolders) {
      persistFolders(
        memoryFolders.map((f) =>
          f.id === created.folderId ? { ...f, noteCount: f.noteCount + 1 } : f
        )
      );
    }

    return created;
  },

  async updateNote(id: string, payload: UpdateNotePayload): Promise<Note> {
    const current = memoryNotes ?? [];
    const existing = current.find((n) => n.id === id);
    const updated: Note = existing
      ? { ...existing, ...payload, updatedAt: new Date().toISOString() }
      : ({} as Note);

    if (existing) {
      persistNotes(current.map((n) => (n.id === id ? updated : n)));
    }

    await apiClient.syncPatch<Note>(
      `/notes/${encodeURIComponent(id)}`,
      payload,
      `note_${id}`,
      updated
    );
    return updated;
  },

  async deleteNote(id: string): Promise<void> {
    await apiRequest(`/notes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const current = memoryNotes ?? [];
    const target = current.find((n) => n.id === id);
    persistNotes(current.filter((n) => n.id !== id));

    if (target?.folderId && memoryFolders) {
      persistFolders(
        memoryFolders.map((f) =>
          f.id === target.folderId
            ? { ...f, noteCount: Math.max(0, f.noteCount - 1) }
            : f
        )
      );
    }
  },

  async togglePin(note: Note): Promise<Note> {
    return this.updateNote(note.id, { isPinned: !note.isPinned });
  },

  async toggleArchive(note: Note): Promise<Note> {
    return this.updateNote(note.id, { isArchived: !note.isArchived });
  },
};
