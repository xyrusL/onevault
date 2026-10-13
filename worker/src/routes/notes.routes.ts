import { Hono } from 'hono';
import { notesService } from '../services/notes.service';
import type { AppBindings } from '../types/env.types';
import type {
  CreateFolderPayload,
  CreateNotePayload,
  UpdateFolderPayload,
  UpdateNotePayload,
} from '../types/notes.types';

export const notesRoutes = new Hono<AppBindings>();

// Folders
notesRoutes.get('/folders', async (c) => {
  const folders = await notesService.listFolders(c.env);
  return c.json(folders);
});

notesRoutes.post('/folders', async (c) => {
  const payload = await c.req.json<CreateFolderPayload>();
  const folder = await notesService.createFolder(c.env, payload);
  return c.json(folder, 201);
});

notesRoutes.patch('/folders/:id', async (c) => {
  const id = c.req.param('id');
  const payload = await c.req.json<UpdateFolderPayload>();
  const folder = await notesService.updateFolder(c.env, id, payload);
  return c.json(folder);
});

notesRoutes.delete('/folders/:id', async (c) => {
  const id = c.req.param('id');
  await notesService.deleteFolder(c.env, id);
  return c.json({ success: true });
});

// Notes
notesRoutes.get('/', async (c) => {
  const folderId = c.req.query('folderId') || undefined;
  const search = c.req.query('search') || undefined;
  const archived = c.req.query('archived');
  const isArchived = archived !== undefined ? archived === 'true' : undefined;

  const notes = await notesService.listNotes(c.env, {
    folderId,
    search,
    isArchived,
  });
  return c.json(notes);
});

notesRoutes.post('/', async (c) => {
  const payload = await c.req.json<CreateNotePayload>();
  const note = await notesService.createNote(c.env, payload);
  return c.json(note, 201);
});

notesRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const payload = await c.req.json<UpdateNotePayload>();
  const note = await notesService.updateNote(c.env, id, payload);
  return c.json(note);
});

notesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await notesService.deleteNote(c.env, id);
  return c.json({ success: true });
});
