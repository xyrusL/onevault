export type NoteColor =
  | 'default'
  | 'yellow'
  | 'coral'
  | 'blue'
  | 'green'
  | 'purple'
  | 'amber';

export interface NoteFolder {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
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

export type TimeFilterRange = 'all' | 'today' | 'week' | 'month';

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

export type NoteChartType = 'pie' | 'bar' | 'line';

export interface NoteChartDataItem {
  name: string;
  value: number;
  color?: string;
}

export interface NoteChartConfig {
  id: string;
  type: NoteChartType;
  title: string;
  data: NoteChartDataItem[];
}

export type NoteEmbedType = 'youtube' | 'video' | 'audio' | 'link';

export interface NoteEmbedConfig {
  id: string;
  url: string;
  type: NoteEmbedType;
  title?: string;
}

