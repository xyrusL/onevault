import { HttpError } from '../lib/http-error';
import type { Env } from '../types/env.types';
import type {
  CreateFolderPayload,
  CreateNotePayload,
  NoteDto,
  NoteFolderDto,
  NoteFolderRow,
  NoteRow,
  UpdateFolderPayload,
  UpdateNotePayload,
} from '../types/notes.types';

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toFolderDto(row: NoteFolderRow): NoteFolderDto {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    noteCount: Number(row.note_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toNoteDto(row: NoteRow): NoteDto {
  return {
    id: row.id,
    folderId: row.folder_id,
    folderName: row.folder_name,
    folderColor: row.folder_color,
    title: row.title,
    content: row.content,
    color: row.color,
    isPinned: Boolean(row.is_pinned),
    isArchived: Boolean(row.is_archived),
    tags: parseTags(row.tags),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const notesService = {
  /**
   * Pre-seed logic hook (no-op in production; completely clean database).
   */
  async seedIfEmpty(_env: Env): Promise<void> {
    // Production mode: zero demo records seeded.
  },

  async listFolders(env: Env): Promise<NoteFolderDto[]> {
    await this.seedIfEmpty(env);
    const result = await env.DB.prepare(
      `SELECT f.*, COUNT(n.id) as note_count
       FROM note_folders f
       LEFT JOIN notes n ON n.folder_id = f.id AND n.is_archived = 0
       GROUP BY f.id
       ORDER BY f.updated_at DESC`
    ).all<NoteFolderRow>();

    return (result.results ?? []).map(toFolderDto);
  },

  async createFolder(env: Env, payload: CreateFolderPayload): Promise<NoteFolderDto> {
    const trimmed = payload.name.trim();
    if (!trimmed) {
      throw new HttpError(400, 'Folder name is required.');
    }

    const id = `fld_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const color = payload.color ?? 'purple';
    const icon = payload.icon ?? 'folder';

    await env.DB.prepare(
      `INSERT INTO note_folders (id, name, color, icon, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, trimmed, color, icon, now, now).run();

    return {
      id,
      name: trimmed,
      color,
      icon,
      noteCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  },

  async updateFolder(
    env: Env,
    id: string,
    payload: UpdateFolderPayload
  ): Promise<NoteFolderDto> {
    const existing = await env.DB.prepare(
      'SELECT * FROM note_folders WHERE id = ?'
    ).bind(id).first<NoteFolderRow>();

    if (!existing) {
      throw new HttpError(404, 'Folder not found.');
    }

    const name = payload.name !== undefined ? payload.name.trim() : existing.name;
    const color = payload.color !== undefined ? payload.color : existing.color;
    const icon = payload.icon !== undefined ? payload.icon : existing.icon;
    const now = new Date().toISOString();

    await env.DB.prepare(
      `UPDATE note_folders SET name = ?, color = ?, icon = ?, updated_at = ? WHERE id = ?`
    ).bind(name, color, icon, now, id).run();

    const noteCountResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM notes WHERE folder_id = ? AND is_archived = 0'
    ).bind(id).first<{ count: number }>();

    return {
      id,
      name,
      color,
      icon,
      noteCount: Number(noteCountResult?.count ?? 0),
      createdAt: existing.created_at,
      updatedAt: now,
    };
  },

  async deleteFolder(env: Env, id: string): Promise<void> {
    // Setting folder_id to NULL on notes handled by foreign key or explicit update
    await env.DB.prepare('UPDATE notes SET folder_id = NULL WHERE folder_id = ?')
      .bind(id)
      .run();

    const result = await env.DB.prepare(
      'DELETE FROM note_folders WHERE id = ?'
    ).bind(id).run();

    if (!result.meta.changes) {
      throw new HttpError(404, 'Folder not found.');
    }
  },

  async listNotes(
    env: Env,
    options?: {
      folderId?: string | null;
      search?: string;
      isArchived?: boolean;
    }
  ): Promise<NoteDto[]> {
    await this.seedIfEmpty(env);

    let query = `
      SELECT n.*, f.name as folder_name, f.color as folder_color
      FROM notes n
      LEFT JOIN note_folders f ON n.folder_id = f.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (options?.isArchived !== undefined) {
      query += ` AND n.is_archived = ?`;
      params.push(options.isArchived ? 1 : 0);
    } else {
      query += ` AND n.is_archived = 0`;
    }

    if (options?.folderId) {
      query += ` AND n.folder_id = ?`;
      params.push(options.folderId);
    }

    if (options?.search) {
      query += ` AND (n.title LIKE ? OR n.content LIKE ? OR n.tags LIKE ?)`;
      const term = `%${options.search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY n.is_pinned DESC, n.updated_at DESC`;

    const result = await env.DB.prepare(query).bind(...params).all<NoteRow>();
    return (result.results ?? []).map(toNoteDto);
  },

  async createNote(env: Env, payload: CreateNotePayload): Promise<NoteDto> {
    const title = payload.title.trim();
    if (!title) {
      throw new HttpError(400, 'Note title is required.');
    }

    const id = `note_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const folderId = payload.folderId || null;
    const content = payload.content ?? '';
    const color = payload.color ?? 'default';
    const isPinned = payload.isPinned ? 1 : 0;
    const tagsJson = JSON.stringify(payload.tags ?? []);

    await env.DB.prepare(
      `INSERT INTO notes (id, folder_id, title, content, color, is_pinned, is_archived, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
    ).bind(id, folderId, title, content, color, isPinned, tagsJson, now, now).run();

    let folderName: string | null = null;
    let folderColor: string | null = null;
    if (folderId) {
      const folder = await env.DB.prepare('SELECT name, color FROM note_folders WHERE id = ?')
        .bind(folderId)
        .first<{ name: string; color: string }>();
      if (folder) {
        folderName = folder.name;
        folderColor = folder.color;
      }
    }

    return {
      id,
      folderId,
      folderName,
      folderColor,
      title,
      content,
      color,
      isPinned: Boolean(isPinned),
      isArchived: false,
      tags: payload.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
  },

  async updateNote(
    env: Env,
    id: string,
    payload: UpdateNotePayload
  ): Promise<NoteDto> {
    const existing = await env.DB.prepare(
      'SELECT * FROM notes WHERE id = ?'
    ).bind(id).first<NoteRow>();

    if (!existing) {
      throw new HttpError(404, 'Note not found.');
    }

    const title = payload.title !== undefined ? payload.title.trim() : existing.title;
    const content = payload.content !== undefined ? payload.content : existing.content;
    const folderId = payload.folderId !== undefined ? (payload.folderId || null) : existing.folder_id;
    const color = payload.color !== undefined ? payload.color : existing.color;
    const isPinned = payload.isPinned !== undefined ? (payload.isPinned ? 1 : 0) : existing.is_pinned;
    const isArchived = payload.isArchived !== undefined ? (payload.isArchived ? 1 : 0) : existing.is_archived;
    const tagsJson = payload.tags !== undefined ? JSON.stringify(payload.tags) : existing.tags;
    const now = new Date().toISOString();

    await env.DB.prepare(
      `UPDATE notes
       SET title = ?, content = ?, folder_id = ?, color = ?, is_pinned = ?, is_archived = ?, tags = ?, updated_at = ?
       WHERE id = ?`
    ).bind(title, content, folderId, color, isPinned, isArchived, tagsJson, now, id).run();

    let folderName: string | null = null;
    let folderColor: string | null = null;
    if (folderId) {
      const folder = await env.DB.prepare('SELECT name, color FROM note_folders WHERE id = ?')
        .bind(folderId)
        .first<{ name: string; color: string }>();
      if (folder) {
        folderName = folder.name;
        folderColor = folder.color;
      }
    }

    return {
      id,
      folderId,
      folderName,
      folderColor,
      title,
      content,
      color,
      isPinned: Boolean(isPinned),
      isArchived: Boolean(isArchived),
      tags: parseTags(tagsJson),
      createdAt: existing.created_at,
      updatedAt: now,
    };
  },

  async deleteNote(env: Env, id: string): Promise<void> {
    const result = await env.DB.prepare('DELETE FROM notes WHERE id = ?')
      .bind(id)
      .run();

    if (!result.meta.changes) {
      throw new HttpError(404, 'Note not found.');
    }
  },
};
