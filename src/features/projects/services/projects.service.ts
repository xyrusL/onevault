import { apiRequest } from '../../../shared/services/api-client.service';
import type {
  ProjectItem,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectStatus,
  InspectSiteResponse,
} from '../types/projects.types';

const CACHE_KEY = 'onevault.projects.cache.v1';

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj_gigamaxx_4k',
    name: 'GIGAMAXX 4K',
    slug: 'gigamaxx',
    description:
      'High-speed 4K streaming web platform — movies, series & anime with zero public API leaks.',
    status: 'active',
    gatewayToken: 'ov_live_gigamaxx_4k_98f2a1b7e4',
    domains: ['gigamaxx.com', 'localhost:5173', 'localhost:4173'],
    upstreamApi: 'https://api.framextv.cc',
    shieldPolicy: {
      antiBot: true,
      rateLimitPerMin: 60,
      streamTokenSigning: true,
      tokenExpiryMinutes: 15,
      originLock: true,
      stealth404: true,
      concealedEndpoints: [
        {
          id: 'ep_framex_primary',
          name: 'FrameX Master API',
          targetUrl: 'https://api.framextv.cc',
          proxyPathPrefix: '/api',
          isSecret: true,
        },
        {
          id: 'ep_framex_embed',
          name: 'FrameX Stream Embed',
          targetUrl: 'https://framextv.cc',
          proxyPathPrefix: '/stream',
          isSecret: true,
        },
      ],
    },
    stats: {
      activeViewers: 1,
      totalRequestsToday: 0,
      blockedThreatsToday: 0,
      avgLatencyMs: 18,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class ProjectsService {
  getCachedProjects(): ProjectItem[] {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    this.saveToStorage(DEFAULT_PROJECTS);
    return DEFAULT_PROJECTS;
  }

  private saveToStorage(projects: ProjectItem[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage:', e);
    }
  }

  /**
   * Fetch connected projects from D1 backend, falling back to local cache
   */
  async getProjects(): Promise<ProjectItem[]> {
    try {
      const remoteData = await apiRequest<ProjectItem[]>('/projects', {
        auth: true,
      });
      if (Array.isArray(remoteData) && remoteData.length > 0) {
        this.saveToStorage(remoteData);
        return remoteData;
      }
    } catch (err) {
      console.warn('[ProjectsService] Remote fetch error, using local-first cache:', err);
    }
    return this.getCachedProjects();
  }

  /**
   * Auto-inspect a target site URL to dynamically extract title, description, and domains
   */
  async inspectSite(url: string): Promise<InspectSiteResponse> {
    try {
      return await apiRequest<InspectSiteResponse>('/projects/inspect', {
        method: 'POST',
        body: { url },
        auth: true,
      });
    } catch {
      // Fallback client-side parsing if worker is not yet deployed
      const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
      const parsed = new URL(cleanUrl);
      const name = parsed.hostname.replace(/^www\./, '').split('.')[0];
      return {
        ok: true,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        slug: name.toLowerCase(),
        description: `Connected Application (${parsed.hostname})`,
        domains: [parsed.host],
        siteUrl: cleanUrl,
      };
    }
  }

  async toggleProjectStatus(
    id: string,
    newStatus: ProjectStatus
  ): Promise<ProjectItem | null> {
    // 1. Optimistic local update
    const list = this.getCachedProjects();
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      this.saveToStorage(list);
    }

    // 2. Persist to D1
    try {
      await apiRequest(`/projects/${id}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
        auth: true,
      });
    } catch (err) {
      console.warn('[ProjectsService] D1 toggle status sync error:', err);
    }

    return idx !== -1 ? list[idx] : null;
  }

  async updateProject(
    id: string,
    payload: UpdateProjectPayload
  ): Promise<ProjectItem | null> {
    const list = this.getCachedProjects();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...payload,
      shieldPolicy: {
        ...list[idx].shieldPolicy,
        ...(payload.shieldPolicy || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage(list);

    // Sync to D1
    try {
      await apiRequest(`/projects/${id}`, {
        method: 'PUT',
        body: payload,
        auth: true,
      });
    } catch (err) {
      console.warn('[ProjectsService] D1 update project sync error:', err);
    }

    return list[idx];
  }

  async createProject(payload: CreateProjectPayload): Promise<ProjectItem> {
    const tempId = `proj_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const localItem: ProjectItem = {
      id: tempId,
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      status: 'connecting',
      gatewayToken: payload.gatewayToken || `ov_live_${payload.slug}_${tempId}`,
      domains: payload.domains,
      upstreamApi: payload.upstreamApi,
      siteUrl: payload.siteUrl,
      shieldPolicy: {
        antiBot: true,
        rateLimitPerMin: 60,
        streamTokenSigning: true,
        tokenExpiryMinutes: 15,
        originLock: true,
        stealth404: true,
        concealedEndpoints: [],
        ...(payload.shieldPolicy || {}),
      },
      stats: {
        activeViewers: 1,
        totalRequestsToday: 0,
        blockedThreatsToday: 0,
        avgLatencyMs: 18,
      },
      createdAt: now,
      updatedAt: now,
    };

    try {
      const remote = await apiRequest<ProjectItem>('/projects', {
        method: 'POST',
        body: payload,
        auth: true,
      });
      if (remote && remote.id) {
        const list = [remote, ...this.getCachedProjects().filter((p) => p.id !== remote.id)];
        this.saveToStorage(list);
        return remote;
      }
    } catch (err) {
      console.warn('[ProjectsService] D1 create project sync error:', err);
    }

    const list = [localItem, ...this.getCachedProjects()];
    this.saveToStorage(list);
    return localItem;
  }

  async deleteProject(id: string): Promise<boolean> {
    const list = this.getCachedProjects().filter((p) => p.id !== id);
    this.saveToStorage(list);

    try {
      await apiRequest(`/projects/${id}`, {
        method: 'DELETE',
        auth: true,
      });
      return true;
    } catch (err) {
      console.warn('[ProjectsService] D1 delete sync error:', err);
      return true;
    }
  }
}

export const projectsService = new ProjectsService();
