export type NoteColor =
  | 'default'
  | 'yellow'
  | 'coral'
  | 'blue'
  | 'green'
  | 'purple'
  | 'amber';

export interface NoteFolderRow {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
  note_count?: number;
}

export interface NoteRow {
  id: string;
  folder_id: string | null;
  title: string;
  content: string;
  color: NoteColor;
  is_pinned: number;
  is_archived: number;
  tags: string;
  created_at: string;
  updated_at: string;
  folder_name?: string | null;
  folder_color?: string | null;
}

export interface NoteFolderDto {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDto {
  id: string;
  folderId: string | null;
  folderName?: string | null;
  folderColor?: string | null;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderPayload {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateFolderPayload {
  name?: string;
  color?: string;
  icon?: string;
}

export interface CreateNotePayload {
  folderId?: string | null;
  title: string;
  content?: string;
  color?: NoteColor;
  isPinned?: boolean;
  tags?: string[];
}

export interface UpdateNotePayload {
  folderId?: string | null;
  title?: string;
  content?: string;
  color?: NoteColor;
  isPinned?: boolean;
  isArchived?: boolean;
  tags?: string[];
}
